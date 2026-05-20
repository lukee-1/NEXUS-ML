# NexusML Pipeline Platform - Frontend + Backend
# Multi-stage build for production deployment

# ─── Stage 1: Build Frontend ─────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Python Backend ─────────────────────────────────────────────────
FROM python:3.11-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and models
COPY backend/ ./backend/
COPY --from=frontend-builder /app/dist ./static/

# Set environment
ENV PYTHONPATH=/app
ENV PORT=8000
ENV MODEL_PATH=/app/backend/models/fraud_detection_model.pkl
ENV SCALER_PATH=/app/backend/models/scaler.pkl
ENV METADATA_PATH=/app/backend/models/model_metadata.json
ENV STATIC_DIR=/app/static

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
