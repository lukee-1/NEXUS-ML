# NexusML Pipeline Platform

A production-grade, enterprise-ready real-time big data machine learning pipeline platform designed for ML Engineers and Data Engineers.


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



**Built for ML Engineers and Data Engineers who want to demonstrate production-grade ML pipeline expertise.**
