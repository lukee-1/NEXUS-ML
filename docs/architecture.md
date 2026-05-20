# NexusML Architecture Documentation

## System Architecture

### High-Level Design

```
                    +------------------+
                    |   React Frontend |
                    |   (Dashboard)    |
                    +--------+---------+
                             |
                             | HTTP / WebSocket
                             v
                    +--------+---------+
                    |  FastAPI Backend |
                    |    (Python)      |
                    +--------+---------+
                             |
            +----------------+----------------+
            |                |                |
            v                v                v
    +-------+------+ +------+------+ +-------+------+
    |  PostgreSQL  | |    Redis    | |   ML Model   |
    | (Persistent) | |   (Cache)   | |  (sklearn)   |
    +--------------+ +-------------+ +--------------+
```

### Data Flow

```
1. Data Ingestion
   Raw transactions → Kafka Producer

2. Stream Processing
   Kafka Consumer → Spark Streaming
   - Feature extraction
   - Data validation
   - Schema enforcement

3. Feature Engineering
   Spark → Feature Store
   - Aggregation windows
   - Derived features
   - Normalization

4. Model Inference
   Feature Vector → ML Model
   - GradientBoostingClassifier
   - 18 input features
   - Real-time scoring

5. Prediction Serving
   Scores → API → Frontend
   - Fraud/safe/review classification
   - Confidence intervals
   - Alert generation
```

### Component Details

#### Frontend (React)
- **Dashboard Shell**: Top navigation, dynamic sidebar, responsive layout
- **Overview**: KPI cards, throughput chart, prediction distribution, pipeline status
- **Pipeline**: ReactFlow DAG visualization, real-time logs, metric charts
- **Orchestration**: Airflow-style DAG viewer with task state transitions
- **Models**: Feature importance, performance history, deployment info
- **Monitoring**: CPU/memory charts, Kafka metrics, Spark cluster status
- **Alerts**: Severity-filtered alert list with resolution workflow

#### Backend (FastAPI)
- **PipelineSimulator**: Generates realistic streaming data every 1s
- **ModelService**: Loads sklearn model, handles feature engineering, predictions
- **Data Architecture**: In-memory deques for metrics/logs, zustand store for state

#### ML Model
- **Type**: GradientBoostingClassifier
- **Features**: 18 (5 derived from raw transaction data)
- **Performance**: AUC-ROC 0.987, Precision 0.94, Recall 0.91
- **Inference**: ~12ms average latency

## Deployment Architectures

### Docker Compose (Development)
```
Frontend + Backend (single container)
PostgreSQL (persistent data)
Redis (caching)
```

### AWS Production
```
ECS Fargate (Frontend + Backend)
RDS PostgreSQL (managed database)
ElastiCache Redis (managed cache)
Application Load Balancer
CloudWatch (monitoring)
```

### Kubernetes (Enterprise)
```
Ingress Controller (nginx)
API Deployment (3 replicas)
PostgreSQL StatefulSet
Redis StatefulSet
PersistentVolumeClaims
HorizontalPodAutoscaler
```
