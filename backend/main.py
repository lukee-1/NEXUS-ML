"""
NexusML Pipeline Platform - FastAPI Backend
Production-grade API for real-time ML pipeline simulation
"""

import os
import json
import random
import asyncio
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from data_simulator import PipelineSimulator
from model_service import ModelService

# ─── Configuration ───────────────────────────────────────────────────────────

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "fraud_detection_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "models", "scaler.pkl")
METADATA_PATH = os.path.join(os.path.dirname(__file__), "models", "model_metadata.json")

# ─── Pydantic Models ─────────────────────────────────────────────────────────

class PredictionRequest(BaseModel):
    transaction_id: str
    amount: float
    hour_of_day: int
    day_of_week: int
    transaction_count_1h: int
    transaction_count_24h: int
    avg_amount_7d: float
    unique_merchants_7d: int
    card_present: int
    merchant_risk_score: float
    distance_from_home: float
    time_since_last_tx: float
    is_new_device: int
    is_new_location: int

class PredictionResponse(BaseModel):
    transaction_id: str
    prediction: str
    confidence: float
    fraud_score: float
    features_used: List[str]
    processing_time_ms: float
    timestamp: str

class StreamControlRequest(BaseModel):
    action: str  # "start", "stop", "pause"
    source: Optional[str] = "all"

class AlertResponse(BaseModel):
    id: str
    severity: str  # "critical", "warning", "info"
    component: str
    message: str
    timestamp: str
    resolved: bool

# ─── Global State ────────────────────────────────────────────────────────────

simulator = PipelineSimulator()
model_service: Optional[ModelService] = None
connected_websockets: List[WebSocket] = []

# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global model_service
    
    # Load ML model
    try:
        model_service = ModelService(MODEL_PATH, SCALER_PATH, METADATA_PATH)
        print(f"[{datetime.now().isoformat()}] ML Model loaded successfully")
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] Warning: Could not load model: {e}")
        model_service = None
    
    # Start simulation
    simulator.start()
    print(f"[{datetime.now().isoformat()}] Pipeline simulation started")
    
    yield
    
    # Shutdown
    simulator.stop()
    print(f"[{datetime.now().isoformat()}] Pipeline simulation stopped")

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="NexusML Pipeline Platform API",
    description="Real-time big data ML pipeline platform backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── WebSocket Manager ───────────────────────────────────────────────────────

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        disconnected = []
        for ws in self.active_connections:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect(ws)

ws_manager = WebSocketManager()

# ─── Background Task: Stream to WebSockets ──────────────────────────────────

async def stream_pipeline_data():
    """Background task that streams pipeline data to all connected WebSockets"""
    while True:
        if ws_manager.active_connections:
            data = {
                "type": "pipeline_update",
                "timestamp": datetime.now().isoformat(),
                "metrics": simulator.get_current_metrics(),
                "logs": simulator.get_recent_logs(5),
                "predictions": simulator.get_prediction_distribution(),
                "node_status": simulator.get_node_status(),
            }
            await ws_manager.broadcast(data)
        await asyncio.sleep(1)

@app.on_event("startup")
async def start_background_tasks():
    asyncio.create_task(stream_pipeline_data())

# ─── API Routes ──────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "NexusML Pipeline Platform API",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model_service is not None,
        "simulation_active": simulator.is_running,
        "active_websocket_connections": len(ws_manager.active_connections),
        "timestamp": datetime.now().isoformat()
    }

# ─── Pipeline Endpoints ──────────────────────────────────────────────────────

@app.get("/api/pipeline/nodes")
async def get_pipeline_nodes():
    """Get pipeline topology nodes and their current status"""
    return {
        "nodes": simulator.get_node_status(),
        "edges": simulator.get_pipeline_edges(),
        "throughput": simulator.get_current_metrics()["throughput"],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/pipeline/metrics")
async def get_pipeline_metrics(hours: int = 1):
    """Get pipeline metrics history"""
    return {
        "throughput": simulator.get_throughput_history(hours),
        "latency": simulator.get_latency_history(hours),
        "error_rate": simulator.get_error_rate_history(hours),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/pipeline/logs")
async def get_pipeline_logs(limit: int = 100):
    """Get recent pipeline processing logs"""
    return {
        "logs": simulator.get_recent_logs(limit),
        "total_count": len(simulator.logs),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/pipeline/control")
async def control_pipeline(request: StreamControlRequest):
    """Control pipeline streaming (start/stop/pause)"""
    if request.action == "start":
        simulator.start()
    elif request.action == "stop":
        simulator.stop()
    elif request.action == "pause":
        simulator.pause()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {request.action}")
    
    return {"status": "success", "action": request.action, "simulation_active": simulator.is_running}

# ─── ML Model Endpoints ──────────────────────────────────────────────────────

@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Run fraud detection prediction on a transaction"""
    if model_service is None:
        raise HTTPException(status_code=503, detail="ML model not available")
    
    start_time = time.time()
    
    # Convert to dict and compute derived features
    tx_data = request.dict()
    result = model_service.predict(tx_data)
    
    processing_time = (time.time() - start_time) * 1000
    
    return PredictionResponse(
        transaction_id=request.transaction_id,
        prediction="fraud" if result["prediction"] == 1 else "safe",
        confidence=result["confidence"],
        fraud_score=result["fraud_score"],
        features_used=result["features_used"],
        processing_time_ms=round(processing_time, 2),
        timestamp=datetime.now().isoformat()
    )

@app.post("/api/predict/batch")
async def predict_batch(requests: List[PredictionRequest]):
    """Run batch predictions"""
    if model_service is None:
        raise HTTPException(status_code=503, detail="ML model not available")
    
    results = []
    for req in requests:
        tx_data = req.dict()
        result = model_service.predict(tx_data)
        results.append({
            "transaction_id": req.transaction_id,
            "prediction": "fraud" if result["prediction"] == 1 else "safe",
            "confidence": result["confidence"],
            "fraud_score": result["fraud_score"],
            "timestamp": datetime.now().isoformat()
        })
    
    return {"predictions": results, "count": len(results)}

@app.get("/api/model/info")
async def get_model_info():
    """Get model metadata and performance metrics"""
    if model_service is None:
        return {"error": "Model not loaded"}
    return model_service.get_metadata()

@app.get("/api/model/feature-importance")
async def get_feature_importance():
    """Get feature importance from the trained model"""
    if model_service is None:
        return {"error": "Model not loaded"}
    return {"feature_importance": model_service.get_feature_importance()}

# ─── Orchestration Endpoints ─────────────────────────────────────────────────

@app.get("/api/orchestration/dags")
async def get_dags():
    """Get list of available DAGs"""
    return {"dags": simulator.get_dags()}

@app.get("/api/orchestration/dags/{dag_id}")
async def get_dag_detail(dag_id: str):
    """Get DAG details with task status"""
    dag = simulator.get_dag_status(dag_id)
    if not dag:
        raise HTTPException(status_code=404, detail=f"DAG {dag_id} not found")
    return dag

@app.post("/api/orchestration/dags/{dag_id}/trigger")
async def trigger_dag(dag_id: str):
    """Trigger a DAG run"""
    success = simulator.trigger_dag(dag_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"DAG {dag_id} not found")
    return {"status": "triggered", "dag_id": dag_id, "timestamp": datetime.now().isoformat()}

# ─── Monitoring Endpoints ────────────────────────────────────────────────────

@app.get("/api/monitoring/system")
async def get_system_metrics():
    """Get system-level metrics (CPU, memory, etc.)"""
    return {
        "cpu_usage": simulator.get_cpu_metrics(),
        "memory_usage": simulator.get_memory_metrics(),
        "disk_usage": simulator.get_disk_metrics(),
        "network_io": simulator.get_network_metrics(),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/monitoring/kafka")
async def get_kafka_metrics():
    """Get Kafka cluster metrics"""
    return {
        "topics": simulator.get_kafka_topics(),
        "consumer_groups": simulator.get_consumer_groups(),
        "broker_metrics": simulator.get_broker_metrics(),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/monitoring/spark")
async def get_spark_metrics():
    """Get Spark cluster metrics"""
    return {
        "applications": simulator.get_spark_apps(),
        "executor_metrics": simulator.get_executor_metrics(),
        "stage_metrics": simulator.get_stage_metrics(),
        "timestamp": datetime.now().isoformat()
    }

# ─── Alerts Endpoints ────────────────────────────────────────────────────────

@app.get("/api/alerts")
async def get_alerts(
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
    limit: int = 50
):
    """Get alerts with optional filtering"""
    alerts = simulator.get_alerts()
    
    if severity:
        alerts = [a for a in alerts if a["severity"] == severity]
    if resolved is not None:
        alerts = [a for a in alerts if a["resolved"] == resolved]
    
    return {"alerts": alerts[:limit], "total": len(alerts)}

@app.post("/api/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    """Resolve an alert"""
    success = simulator.resolve_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    return {"status": "resolved", "alert_id": alert_id}

# ─── WebSocket Endpoint ──────────────────────────────────────────────────────

@app.websocket("/ws/pipeline")
async def pipeline_websocket(websocket: WebSocket):
    """WebSocket for real-time pipeline updates"""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle client messages
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("action") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.now().isoformat()})
            except json.JSONDecodeError:
                pass
    except Exception:
        pass
    finally:
        ws_manager.disconnect(websocket)

# ─── Main ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
