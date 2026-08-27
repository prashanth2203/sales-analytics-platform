FROM python:3.11-slim

WORKDIR /app

# Install postgres dependencies
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install flask

COPY . .

EXPOSE 8000

CMD ["python", "app.py"]
