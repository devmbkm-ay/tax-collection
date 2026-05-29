FROM python:3.12-slim

WORKDIR /app

# Install OS-level dependencies for reportlab / lxml
RUN apt-get update && apt-get install -y --no-install-recommends \
    libxml2 libxslt1.1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir \
    fastapi uvicorn[standard] python-multipart pymongo python-dotenv \
    reportlab python-dateutil beautifulsoup4 lxml secure-smtplib

COPY worldremit/ ./worldremit/
COPY api.py .

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
