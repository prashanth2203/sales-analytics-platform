import os
import io
import json
from datetime import datetime
import pandas as pd
import boto3
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(dotenv_path='../backend/.env')

# --- CONFIGURATION ---
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL and "?schema=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("?schema=")[0]
# For sqlalchemy, we need to adapt prisma connection string if needed
# Prisma format: postgresql://sales_user:sales_password@localhost:5433/sales_db?schema=public
engine = create_engine(DATABASE_URL)

MINIO_ENDPOINT = "http://localhost:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin"
BUCKET_NAME = "raw"

s3_client = boto3.client(
    's3',
    endpoint_url=MINIO_ENDPOINT,
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY
)

def extract_to_minio():
    print("Starting Extraction & Data Lake Loading...")
    
    try:
        s3_client.head_bucket(Bucket=BUCKET_NAME)
    except:
        print(f"Bucket {BUCKET_NAME} does not exist. Creating...")
        s3_client.create_bucket(Bucket=BUCKET_NAME)
    
    # Read from operational tables
    tables = {
        'customers': 'SELECT * FROM "Customer"',
        'products': 'SELECT * FROM "Product"',
        'orders': 'SELECT * FROM "Order"'
    }

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    dataframes = {}

    for name, query in tables.items():
        print(f"Extracting {name}...")
        df = pd.read_sql(query, engine)
        dataframes[name] = df
        
        # Save as JSON and upload to MinIO
        json_buffer = io.StringIO()
        df.to_json(json_buffer, orient='records', date_format='iso')
        
        object_name = f"raw/{name}/{name}_{timestamp}.json"
        
        print(f"Uploading to Data Lake: {object_name}...")
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=object_name,
            Body=json_buffer.getvalue()
        )
    print("Data Lake Load Complete.")
    return dataframes

def create_warehouse_schema():
    print("Creating Data Warehouse Star Schema...")
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

def transform_and_load(dataframes):
    print("Starting Transformation & Warehouse Loading...")
    
    df_customers = dataframes['customers']
    df_products = dataframes['products']
    df_orders = dataframes['orders']
    
    # --- Load Dimensions ---
    dim_customer = df_customers[['id', 'name', 'city']].rename(columns={'id': 'original_id'})
    dim_product = df_products[['id', 'name', 'category', 'price']].rename(columns={'id': 'original_id'})
    
    print("Loading dim_customer...")
    with engine.connect() as conn:
        conn.execute(text("TRUNCATE TABLE dim_customer CASCADE"))
        conn.commit()
    dim_customer.to_sql('dim_customer', engine, if_exists='append', index=False)
    
    print("Loading dim_product...")
    with engine.connect() as conn:
        conn.execute(text("TRUNCATE TABLE dim_product CASCADE"))
        conn.commit()
    dim_product.to_sql('dim_product', engine, if_exists='append', index=False)
    
    # --- Transform Fact Table ---
    print("Transforming fact_sales...")
    # Fetch generated dimension keys
    loaded_customers = pd.read_sql("SELECT customer_id, original_id FROM dim_customer", engine)
    loaded_products = pd.read_sql("SELECT product_id, original_id FROM dim_product", engine)
    
    fact_sales = df_orders.copy()
    fact_sales = fact_sales.rename(columns={'id': 'original_order_id', 'createdAt': 'sale_date'})
    
    # Map customer_id
    fact_sales = fact_sales.merge(loaded_customers, left_on='customerId', right_on='original_id', how='left')
    # Map product_id
    fact_sales = fact_sales.merge(loaded_products, left_on='productId', right_on='original_id', how='left')
    
    fact_sales = fact_sales[['original_order_id', 'customer_id', 'product_id', 'quantity', 'revenue', 'sale_date']]
    
    print("Loading fact_sales...")
    with engine.connect() as conn:
        conn.execute(text("TRUNCATE TABLE fact_sales CASCADE"))
        conn.commit()
    fact_sales.to_sql('fact_sales', engine, if_exists='append', index=False)
    
    print("Data Warehouse Load Complete!")

if __name__ == "__main__":
    create_warehouse_schema()
    dfs = extract_to_minio()
    transform_and_load(dfs)
