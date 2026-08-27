import os
import io
import json
import traceback
from datetime import datetime
import pandas as pd
import boto3
from sqlalchemy import create_engine, text

# We will use Flask to expose the trigger and status
from flask import Flask, jsonify
import threading

app = Flask(__name__)

# --- CONFIGURATION ---
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL and "?schema=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("?schema=")[0]

MINIO_ENDPOINT = os.environ.get('MINIO_ENDPOINT', "http://localhost:9000")
MINIO_ACCESS_KEY = os.environ.get('MINIO_ACCESS_KEY', "minioadmin")
MINIO_SECRET_KEY = os.environ.get('MINIO_SECRET_KEY', "minioadmin")
BUCKET_NAME = "raw"

# Global state for simple status tracking
pipeline_state = {
    "jobId": None,
    "status": "idle", # idle, running, completed, failed
    "startedAt": None,
    "completedAt": None,
    "lastSuccessfulRun": None,
    "logs": [],
    "records": {
        "customers": 0,
        "products": 0,
        "orders": 0
    }
}

def log(msg):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_line = f"[{timestamp}] {msg}"
    print(log_line)
    pipeline_state["logs"].append(log_line)

def run_pipeline():
    try:
        pipeline_state["status"] = "running"
        pipeline_state["startedAt"] = datetime.now().isoformat()
        pipeline_state["completedAt"] = None
        pipeline_state["logs"] = []
        pipeline_state["records"] = {"customers": 0, "products": 0, "orders": 0}
        
        log("Initializing database connection...")
        engine = create_engine(DATABASE_URL)
        
        s3_client = boto3.client(
            's3',
            endpoint_url=MINIO_ENDPOINT,
            aws_access_key_id=MINIO_ACCESS_KEY,
            aws_secret_access_key=MINIO_SECRET_KEY
        )
        
        log("Starting Extraction & Data Lake Loading...")
        try:
            s3_client.head_bucket(Bucket=BUCKET_NAME)
        except:
            log(f"Bucket {BUCKET_NAME} does not exist. Creating...")
            s3_client.create_bucket(Bucket=BUCKET_NAME)
        
        tables = {
            'customers': 'SELECT * FROM "Customer"',
            'products': 'SELECT * FROM "Product"',
            'orders': 'SELECT * FROM "Order"'
        }

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        dataframes = {}

        for name, query in tables.items():
            log(f"Extracting {name}...")
            df = pd.read_sql(query, engine)
            dataframes[name] = df
            pipeline_state["records"][name] = len(df)
            
            json_buffer = io.StringIO()
            df.to_json(json_buffer, orient='records', date_format='iso')
            
            object_name = f"raw/{name}/{name}_{timestamp}.json"
            
            log(f"Uploading to Data Lake: {object_name}...")
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=object_name,
                Body=json_buffer.getvalue()
            )
        log("Data Lake Load Complete.")
        
        log("Creating Data Warehouse Star Schema...")
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS dim_customer (
                    customer_id SERIAL PRIMARY KEY,
                    original_id INTEGER,
                    name VARCHAR(255),
                    city VARCHAR(255)
                );
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS dim_product (
                    product_id SERIAL PRIMARY KEY,
                    original_id INTEGER,
                    name VARCHAR(255),
                    category VARCHAR(255),
                    price DOUBLE PRECISION
                );
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS fact_sales (
                    sale_id SERIAL PRIMARY KEY,
                    original_order_id INTEGER,
                    customer_id INTEGER REFERENCES dim_customer(customer_id),
                    product_id INTEGER REFERENCES dim_product(product_id),
                    quantity INTEGER,
                    revenue DOUBLE PRECISION,
                    sale_date TIMESTAMP
                );
            """))
            conn.commit()

        log("Starting Transformation & Warehouse Loading...")
        df_customers = dataframes['customers']
        df_products = dataframes['products']
        df_orders = dataframes['orders']
        
        dim_customer = df_customers[['id', 'name', 'city']].rename(columns={'id': 'original_id'})
        dim_product = df_products[['id', 'name', 'category', 'price']].rename(columns={'id': 'original_id'})
        
        log("Loading dim_customer...")
        with engine.connect() as conn:
            conn.execute(text("TRUNCATE TABLE dim_customer CASCADE"))
            conn.commit()
        dim_customer.to_sql('dim_customer', engine, if_exists='append', index=False)
        
        log("Loading dim_product...")
        with engine.connect() as conn:
            conn.execute(text("TRUNCATE TABLE dim_product CASCADE"))
            conn.commit()
        dim_product.to_sql('dim_product', engine, if_exists='append', index=False)
        
        log("Transforming fact_sales...")
        loaded_customers = pd.read_sql("SELECT customer_id, original_id FROM dim_customer", engine)
        loaded_products = pd.read_sql("SELECT product_id, original_id FROM dim_product", engine)
        
        fact_sales = df_orders.copy()
        fact_sales = fact_sales.rename(columns={'id': 'original_order_id', 'createdAt': 'sale_date'})
        fact_sales = fact_sales.merge(loaded_customers, left_on='customerId', right_on='original_id', how='left')
        fact_sales = fact_sales.merge(loaded_products, left_on='productId', right_on='original_id', how='left')
        fact_sales = fact_sales[['original_order_id', 'customer_id', 'product_id', 'quantity', 'revenue', 'sale_date']]
        
        log("Loading fact_sales...")
        with engine.connect() as conn:
            conn.execute(text("TRUNCATE TABLE fact_sales CASCADE"))
            conn.commit()
        fact_sales.to_sql('fact_sales', engine, if_exists='append', index=False)
        
        log("Data Warehouse Load Complete!")
        pipeline_state["status"] = "completed"
        pipeline_state["completedAt"] = datetime.now().isoformat()
        pipeline_state["lastSuccessfulRun"] = pipeline_state["completedAt"]
        
    except Exception as e:
        log(f"ETL Failed: {str(e)}")
        log(traceback.format_exc())
        pipeline_state["status"] = "failed"
        pipeline_state["completedAt"] = datetime.now().isoformat()

@app.route('/api/pipeline/run', methods=['POST'])
def trigger():
    if pipeline_state["status"] == "running":
        return jsonify({"error": "Pipeline is already running"}), 400
    
    pipeline_state["jobId"] = f"job_{int(datetime.now().timestamp())}"
    
    # Run in background thread
    thread = threading.Thread(target=run_pipeline)
    thread.start()
    
    return jsonify({"jobId": pipeline_state["jobId"], "status": "started"})

@app.route('/api/pipeline/status', methods=['GET'])
def status():
    return jsonify(pipeline_state)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
