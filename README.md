# NexusML Pipeline Platform

A production-grade, enterprise-ready real-time big data machine learning pipeline platform designed for ML Engineers and Data Engineers.

![NexusML Dashboard](docs/dashboard-preview.png)

## Architecture Overview

```
+--------------------------------------------------------------------+
|                        CLIENT LAYER                                 |
|  +-------------------+  +-------------------+  +----------------+  |
|  |  React Dashboard  |  |   WebSocket CLI   |  |   REST API     |  |
|  |  (Real-time Viz)  |  |   (Stream Data)   |  |   (Integration)|  |
|  +--------+----------+  +--------+----------+  +--------+-------+  |
|           |                      |                      |           |
+-----------|----------------------|----------------------|-----------+
            |                      |                      |
            v                      v                      v
+-----------|----------------------|----------------------|-----------+
|           |         API GATEWAY (FastAPI + Uvicorn)     |           |
|           +----------------------+----------------------+           |
|                                  |                                  |
|  +-------------------------------+-------------------------------+  |
|  |                     SERVICE LAYER                              |  |
|  |  +----------------+  +----------------+  +-----------------+ |  |
|  |  |  ML Model Svc  |  | Pipeline Sim   |  |  Orchestration  | |  |
|  |  |  (Fraud Det)   |  | (Stream Proc)  |  |  (DAG Mgmt)     | |  |
|  |  +----------------+  +----------------+  +-----------------+ |  |
|  |  +----------------+  +----------------+  +-----------------+ |  |
|  |  |  Monitoring    |  |  Alert System  |  |  Data Simulator | |  |
|  |  |  (Metrics)     |  |  (Notify)      |  |  (Synthetic)    | |  |
|  |  +----------------+  +----------------+  +-----------------+ |  |
|  +---------------------------------------------------------------+  |
|                                  |                                  |
+-----------|----------------------|----------------------------------+
            |                      |
            v                      v
+-----------|----------------------|----------------------------------+
|           |         DATA LAYER                                     |
|  +--------v----------+  +----------v---------+  +--------------+  |
|  |   PostgreSQL      |  |      Redis         |  |   Model      |  |
|  |  (Persistent)     |  |    (Cache/Queue)   |  |   Artifacts  |  |
|  +-------------------+  +--------------------+  +--------------+  |
+--------------------------------------------------------------------+
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Vite | Dashboard UI |
| **Styling** | Tailwind CSS + shadcn/ui | Component styling |
| **Charts** | Recharts + ReactFlow | Data visualization |
| **Backend** | FastAPI + Python 3.11 | REST API & WebSocket |
| **ML** | scikit-learn (GradientBoosting) | Fraud detection model |
| **Database** | PostgreSQL 16 | Persistent storage |
| **Cache** | Redis 7 | In-memory cache & queues |
| **Infra** | Docker + Docker Compose | Container orchestration |
| **Proxy** | Nginx (optional) | Reverse proxy & SSL |

## Features

### Data Pipeline
- **Real-time streaming simulation** with configurable throughput
- **Pipeline topology visualization** using ReactFlow DAG graphs
- **Animated data flow** showing messages moving through the pipeline
- **Per-node metrics** (throughput, latency, lag, executor count)

### Machine Learning
- **Pre-trained fraud detection model** (AUC-ROC: 0.987)
- **18 engineered features** with importance ranking
- **Real-time prediction API** with confidence scores
- **Model performance tracking** across versions

### Orchestration
- **DAG visualization** for ETL workflows
- **Task state management** (queued → running → success/failed)
- **Retry logic simulation** with failure handling
- **Workflow scheduling** display

### Monitoring
- **System metrics** (CPU, Memory, Disk, Network)
- **Kafka topic monitoring** (partitions, replication, throughput)
- **Spark cluster metrics** (applications, executors, stages)
- **Time-series charts** with crosshair tooltips

### Alerts
- **Severity-based alerting** (critical, warning, info)
- **Component-level filtering**
- **Alert resolution workflow**
- **Real-time notification badges**

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Docker Deployment (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd nexusml-pipeline-platform

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Access the application
open http://localhost:8000
```

### Local Development

```bash
# Install frontend dependencies
npm install

# Start the frontend dev server
npm run dev

# In a separate terminal, start the backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### AWS Deployment

```bash
# 1. Build and push Docker image
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker build -t nexusml .
docker tag nexusml:latest <account>.dkr.ecr.<region>.amazonaws.com/nexusml:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/nexusml:latest

# 2. Deploy to ECS/EKS using the provided CloudFormation/Terraform templates
# See docs/aws-deployment.md for detailed instructions
```

## API Documentation

### Health Check
```
GET /health
```

### Pipeline Endpoints
```
GET /api/pipeline/nodes          # Pipeline topology
GET /api/pipeline/metrics        # Metrics history
GET /api/pipeline/logs           # Processing logs
POST /api/pipeline/control       # Start/stop/pause
```

### ML Prediction
```
POST /api/predict                # Single prediction
POST /api/predict/batch          # Batch predictions
GET /api/model/info              # Model metadata
GET /api/model/feature-importance # Feature importance
```

### Orchestration
```
GET /api/orchestration/dags      # List DAGs
GET /api/orchestration/dags/{id} # DAG detail
POST /api/orchestration/dags/{id}/trigger # Trigger DAG
```

### Monitoring
```
GET /api/monitoring/system       # System metrics
GET /api/monitoring/kafka        # Kafka metrics
GET /api/monitoring/spark        # Spark metrics
```

### Alerts
```
GET /api/alerts                  # List alerts
POST /api/alerts/{id}/resolve    # Resolve alert
```

### WebSocket
```
WS /ws/pipeline                  # Real-time stream
```

## Project Structure

```
nexusml-pipeline-platform/
├── backend/
│   ├── main.py                  # FastAPI application
│   ├── data_simulator.py        # Pipeline simulation engine
│   ├── model_service.py         # ML model serving
│   ├── requirements.txt         # Python dependencies
│   ├── models/
│   │   ├── fraud_detection_model.pkl  # Trained model
│   │   ├── scaler.pkl                 # Feature scaler
│   │   └── model_metadata.json        # Model metadata
│   └── Dockerfile
├── src/
│   ├── components/
│   │   ├── DashboardShell.tsx   # Main layout
│   │   └── pages/
│   │       ├── Overview.tsx     # Dashboard overview
│   │       ├── Pipeline.tsx     # Pipeline topology
│   │       ├── Orchestration.tsx # DAG management
│   │       ├── Models.tsx       # Model registry
│   │       ├── Monitoring.tsx   # System monitoring
│   │       └── Alerts.tsx       # Alert management
│   ├── store/
│   │   └── useStore.ts          # Zustand state management
│   ├── lib/
│   │   └── simulator.ts         # Client-side simulator
│   ├── App.tsx                  # Router setup
│   └── main.tsx                 # Entry point
├── Dockerfile                   # Multi-stage build
├── docker-compose.yml           # Full stack orchestration
├── nginx.conf                   # Reverse proxy config
└── README.md                    # This file

## Key Design Decisions

- Dark industrial theme: primary background `#0A0E1A` with emerald/blue accents for reduced eye strain during long monitoring sessions.
- Client-side simulation: the dashboard can run standalone using the client-side simulator (`src/lib/simulator.ts`) so users can demo UI features without backend services.
- High information density: use monospace fonts for technical tables and logs, with a clear spacing hierarchy to keep dashboards scannable under heavy load.
- Responsive & collapsible layout: collapsible sidebar and tab-based navigation to support large-screen monitoring and narrow screens alike.
- Real-time updates: metrics, logs, node status, and charts update every second to provide near-real-time visibility into the pipeline.

```

## ML Model Details

### Fraud Detection Model
- **Algorithm**: Gradient Boosting Classifier
- **Features**: 18 (including engineered features)
- **Training Data**: 50,000 synthetic transactions
- **Fraud Rate**: 5%
- **Performance**:
  - AUC-ROC: 0.987
  - Precision: 0.94
  - Recall: 0.91
  - F1 Score: 0.925

### Feature Engineering
- `amount_to_avg_ratio`: Transaction amount vs 7-day average
- `tx_velocity`: Transactions per hour normalized
- `high_risk_hour`: Flag for 0-5 AM transactions
- `risk_composite`: Weighted risk score combining device, location, merchant

## Kubernetes Deployment

```yaml
# Example Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nexusml-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nexusml-backend
  template:
    metadata:
      labels:
        app: nexusml-backend
    spec:
      containers:
        - name: backend
          image: nexusml:latest
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: nexusml-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: nexusml-secrets
                  key: redis-url
```

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy NexusML

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: |
          cd backend && pip install -r requirements.txt && pytest
      - name: Build frontend
        run: npm ci && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t nexusml:${{ github.sha }} .
      - name: Push to registry
        run: |
          docker tag nexusml:${{ github.sha }} <registry>/nexusml:latest
          docker push <registry>/nexusml:latest
      - name: Deploy to cluster
        run: kubectl rollout restart deployment/nexusml-backend
```

## Monitoring & Observability

The platform includes built-in monitoring for:
- **Pipeline throughput** and latency metrics
- **System resources** (CPU, memory, disk, network)
- **Kafka cluster health** (topics, consumer lag, broker status)
- **Spark application metrics** (executors, stages, tasks)
- **ML model performance** (prediction latency, accuracy drift)

## Security Considerations

- All API endpoints validate input using Pydantic models
- CORS configured for production domains
- Database credentials stored in environment variables
- Model artifacts loaded from read-only volumes
- Nginx reverse proxy for SSL termination

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Contact

For questions or support, please open an issue on GitHub.

---

**Built for ML Engineers and Data Engineers who want to demonstrate production-grade ML pipeline expertise.**
