# SALES//DATA

A complete Full-Stack Data Lake & Data Warehouse Analytics Platform.

## Overview

This project implements a modern data engineering and full-stack web application designed to separate operational data workloads from heavy analytics workloads. The architecture leverages a Next.js frontend, a Node.js backend, a dedicated Python ETL microservice, a PostgreSQL database (acting as both Operational DB and Data Warehouse), and a MinIO Data Lake.

See [architecture.md](./architecture.md) for a detailed breakdown of the internal data flow.

## Requirements
- Docker
- Docker Compose

## Quick Start (Complete Stack)

To run the entire application cleanly using Docker orchestration:

```bash
docker compose up --build -d
```

### Accessing the Services
Once Docker Compose has finished booting and networking the containers, you can access the following services natively on your host machine:

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **MinIO Data Lake Console**: [http://localhost:9001](http://localhost:9001) (Credentials: `minioadmin` / `minioadmin`)

## Verification Steps

1. **Verify Operational Data**: Upon starting the stack, use `docker exec -it sales_backend npm run seed` if the operational database is empty. (The seed script generates 1,500 realistic orders).
2. **Trigger the ETL Pipeline**: Navigate to `http://localhost:3000/pipeline`. Click the "Run ETL Pipeline" button.
3. **Monitor Execution**: Watch the terminal output stream in the UI as the Python ETL service extracts the data.
4. **Verify the Data Lake**: Open the MinIO console (`http://localhost:9001`) and verify that the `raw/` bucket now contains timestamped JSON extracts.
5. **Verify the Dashboards**: Navigate to `http://localhost:3000/` and `http://localhost:3000/analytics`. The dashboards will beautifully render the metrics directly from the Data Warehouse Star Schema!

## Environment Variables

The application relies on internal Docker networking, so the `.env` parameters inside the containers are automatically mapped via `docker-compose.yml`. For local development outside of Docker, the following environment variables are utilized:

- `DATABASE_URL`: The PostgreSQL connection string.
- `ETL_SERVICE_URL`: The URL to the dedicated Python ETL API.
- `MINIO_ENDPOINT`: The S3 connection endpoint.
