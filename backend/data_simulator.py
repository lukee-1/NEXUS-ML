"""
Pipeline Data Simulator
Generates realistic streaming data, metrics, and system states for the dashboard.
"""

import random
import time
import uuid
import threading
from datetime import datetime, timedelta
from collections import deque
from typing import Dict, List, Optional

import numpy as np


class PipelineSimulator:
    """Simulates a real-time data pipeline with ML processing"""
    
    def __init__(self):
        self.is_running = False
        self.is_paused = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        
        # Data stores
        self.logs: deque = deque(maxlen=1000)
        self.metrics_history: deque = deque(maxlen=500)
        self.throughput_history: deque = deque(maxlen=3600)
        self.latency_history: deque = deque(maxlen=3600)
        self.error_rate_history: deque = deque(maxlen=3600)
        self.alerts: List[dict] = []
        self.dag_states: Dict[str, dict] = {}
        self.prediction_counts = {"fraud": 0, "safe": 0, "review": 0}
        self.total_transactions = 0
        self.start_time = datetime.now()
        
        # Pipeline nodes
        self.nodes = self._init_nodes()
        self.edges = self._init_edges()
        self.dags = self._init_dags()
        
        # System metrics history
        self.cpu_history = deque(maxlen=3600)
        self.memory_history = deque(maxlen=3600)
        
        # Seed initial data
        self._seed_initial_data()
    
    def _init_nodes(self) -> List[dict]:
        return [
            {"id": "data-source", "name": "Data Source", "type": "source", "status": "active", "throughput": 1250, "icon": "database"},
            {"id": "kafka", "name": "Kafka Cluster", "type": "queue", "status": "active", "throughput": 1248, "lag": 45, "icon": "zap"},
            {"id": "spark", "name": "Spark Streaming", "type": "processor", "status": "active", "throughput": 1180, "executor": "3/3", "icon": "cpu"},
            {"id": "feature-store", "name": "Feature Store", "type": "storage", "status": "active", "throughput": 1180, "latency": "12ms", "icon": "hard-drive"},
            {"id": "model", "name": "ML Model", "type": "inference", "status": "active", "throughput": 1180, "latency": "45ms", "icon": "brain"},
            {"id": "predictions", "name": "Predictions", "type": "sink", "status": "active", "throughput": 1180, "icon": "check-circle"},
        ]
    
    def _init_edges(self) -> List[dict]:
        return [
            {"source": "data-source", "target": "kafka", "label": "raw-events", "rate": 1250},
            {"source": "kafka", "target": "spark", "label": "consumer-group", "rate": 1248},
            {"source": "spark", "target": "feature-store", "label": "features", "rate": 1180},
            {"source": "feature-store", "target": "model", "label": "feature-vector", "rate": 1180},
            {"source": "model", "target": "predictions", "label": "scores", "rate": 1180},
        ]
    
    def _init_dags(self) -> List[dict]:
        dag_defs = [
            {
                "id": "daily_feature_backfill",
                "name": "Daily Feature Backfill",
                "schedule": "0 2 * * *",
                "owner": "ml-team",
                "tasks": [
                    {"id": "extract_raw", "name": "Extract Raw Data", "dependencies": []},
                    {"id": "validate_schema", "name": "Validate Schema", "dependencies": ["extract_raw"]},
                    {"id": "clean_missing", "name": "Clean Missing Values", "dependencies": ["validate_schema"]},
                    {"id": "engineer_features", "name": "Engineer Features", "dependencies": ["clean_missing"]},
                    {"id": "store_features", "name": "Store Features", "dependencies": ["engineer_features"]},
                    {"id": "validate_features", "name": "Validate Features", "dependencies": ["store_features"]},
                ]
            },
            {
                "id": "model_retraining",
                "name": "Model Retraining Pipeline",
                "schedule": "0 3 * * 0",
                "owner": "ml-team",
                "tasks": [
                    {"id": "fetch_training_data", "name": "Fetch Training Data", "dependencies": []},
                    {"id": "split_data", "name": "Train/Test Split", "dependencies": ["fetch_training_data"]},
                    {"id": "train_model", "name": "Train XGBoost Model", "dependencies": ["split_data"]},
                    {"id": "evaluate_model", "name": "Evaluate Performance", "dependencies": ["train_model"]},
                    {"id": "model_validation", "name": "Model Validation", "dependencies": ["evaluate_model"]},
                    {"id": "deploy_model", "name": "Deploy to Production", "dependencies": ["model_validation"]},
                ]
            },
            {
                "id": "data_quality_check",
                "name": "Data Quality Check",
                "schedule": "0 */4 * * *",
                "owner": "data-team",
                "tasks": [
                    {"id": "check_completeness", "name": "Check Completeness", "dependencies": []},
                    {"id": "check_freshness", "name": "Check Freshness", "dependencies": []},
                    {"id": "check_distribution", "name": "Check Distribution", "dependencies": ["check_completeness", "check_freshness"]},
                    {"id": "generate_report", "name": "Generate Report", "dependencies": ["check_distribution"]},
                ]
            }
        ]
        
        # Initialize DAG states
        for dag in dag_defs:
            self.dag_states[dag["id"]] = {
                **dag,
                "status": "idle",
                "last_run": None,
                "next_run": (datetime.now() + timedelta(hours=2)).isoformat(),
                "run_count": random.randint(100, 500),
                "task_states": {t["id"]: self._random_task_state() for t in dag["tasks"]},
                "active_run": None
            }
        
        return dag_defs
    
    def _random_task_state(self) -> dict:
        states = ["success", "success", "success", "success", "running", "queued", "failed"]
        weights = [0.6, 0.05, 0.05, 0.05, 0.08, 0.08, 0.09]
        status = random.choices(states, weights=weights)[0]
        
        return {
            "status": status,
            "start_time": (datetime.now() - timedelta(minutes=random.randint(1, 60))).isoformat() if status != "queued" else None,
            "duration": f"{random.randint(5, 300)}s" if status in ["success", "failed"] else None,
            "retry_count": random.randint(0, 2) if status == "failed" else 0,
            "logs": []
        }
    
    def _seed_initial_data(self):
        """Generate initial historical data"""
        now = datetime.now()
        for i in range(300):
            ts = now - timedelta(seconds=300 - i)
            self.throughput_history.append({
                "timestamp": ts.isoformat(),
                "value": random.gauss(1200, 150)
            })
            self.latency_history.append({
                "timestamp": ts.isoformat(),
                "value": random.gauss(45, 12)
            })
            self.error_rate_history.append({
                "timestamp": ts.isoformat(),
                "value": random.gauss(0.5, 0.3)
            })
        
        # Seed some initial logs
        log_templates = [
            ("INFO", "spark-worker-{}", "Processed batch #{} ({} records)"),
            ("INFO", "feature-store", "Extracted {} features for user_id: {}"),
            ("INFO", "model-svc", "Inference completed in {}ms"),
            ("WARN", "kafka-consumer", "Consumer lag detected: {} messages"),
            ("INFO", "predictions", "Fraud detected - Transaction ID: {} (Score: {:.2f})"),
            ("INFO", "data-source", "Ingested {} transactions from merchant {}"),
            ("ERROR", "spark-executor-2", "Task failed, retrying (attempt {}/3)"),
            ("INFO", "feature-store", "Feature drift detected in 'amount_log', updating statistics"),
        ]
        
        for i in range(50):
            template = random.choice(log_templates)
            level, component, msg_template = template
            ts = now - timedelta(seconds=300 - i * 6)
            
            if "batch" in msg_template:
                msg = msg_template.format(random.randint(1, 5), random.randint(40000, 50000), random.randint(800, 1500))
            elif "features for user" in msg_template:
                msg = msg_template.format(random.randint(40, 60), random.randint(1000, 9999))
            elif "Inference" in msg_template:
                msg = msg_template.format(random.randint(20, 80))
            elif "lag" in msg_template:
                msg = msg_template.format(random.randint(10, 200))
            elif "Fraud detected" in msg_template:
                msg = msg_template.format(f"TX-{random.randint(1000, 9999)}", random.uniform(0.7, 0.99))
            elif "Ingested" in msg_template:
                msg = msg_template.format(random.randint(500, 2000), f"MERCH-{random.randint(10, 99)}")
            elif "retrying" in msg_template:
                msg = msg_template.format(random.randint(1, 3))
            else:
                msg = msg_template
            
            self.logs.append({
                "timestamp": ts.strftime("%H:%M:%S"),
                "level": level,
                "component": component.format(random.randint(1, 4)) if "{}" in component else component,
                "message": msg
            })
        
        # Seed initial alerts
        self.alerts = [
            {"id": "ALT-001", "severity": "warning", "component": "kafka", "message": "Consumer lag exceeds threshold (150 messages)", "timestamp": (now - timedelta(hours=2)).isoformat(), "resolved": False},
            {"id": "ALT-002", "severity": "critical", "component": "spark", "message": "Executor memory usage > 90%", "timestamp": (now - timedelta(hours=1)).isoformat(), "resolved": True},
            {"id": "ALT-003", "severity": "info", "component": "model", "message": "Model drift detected - AUC dropped by 0.03", "timestamp": (now - timedelta(minutes=30)).isoformat(), "resolved": False},
            {"id": "ALT-004", "severity": "warning", "component": "feature-store", "message": "Feature freshness delay: 45 minutes", "timestamp": (now - timedelta(minutes=15)).isoformat(), "resolved": False},
            {"id": "ALT-005", "severity": "critical", "component": "api", "message": "API latency p99 > 500ms for 5 minutes", "timestamp": (now - timedelta(minutes=5)).isoformat(), "resolved": False},
        ]
        
        # Seed prediction counts
        self.prediction_counts = {"fraud": random.randint(40, 60), "safe": random.randint(800, 950), "review": random.randint(30, 60)}
    
    # ─── Simulation Loop ─────────────────────────────────────────────────────
    
    def start(self):
        if not self.is_running:
            self.is_running = True
            self.is_paused = False
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._simulation_loop, daemon=True)
            self._thread.start()
    
    def stop(self):
        self.is_running = False
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2)
    
    def pause(self):
        self.is_paused = not self.is_paused
    
    def _simulation_loop(self):
        """Main simulation loop - runs in background thread"""
        tick = 0
        while not self._stop_event.is_set():
            if not self.is_paused:
                with self._lock:
                    self._update_metrics(tick)
                    self._generate_log(tick)
                    self._update_nodes(tick)
                    if tick % 10 == 0:
                        self._maybe_generate_alert()
                    if tick % 30 == 0:
                        self._update_dag_states()
                tick += 1
            time.sleep(1)
    
    def _update_metrics(self, tick: int):
        """Update throughput, latency, and error rate metrics"""
        ts = datetime.now().isoformat()
        
        # Throughput with some realistic variation
        base_throughput = 1200 + 50 * np.sin(tick / 60)  # Slow cycle
        throughput = max(200, base_throughput + random.gauss(0, 100))
        
        # Latency correlates inversely with throughput spikes
        base_latency = 45 + random.gauss(0, 8)
        if throughput > 1400:
            base_latency += 15
        
        # Error rate (mostly low, occasional spikes)
        error_rate = max(0, random.gauss(0.5, 0.2))
        if random.random() < 0.02:
            error_rate += random.uniform(2, 5)
        
        self.throughput_history.append({"timestamp": ts, "value": round(throughput, 1)})
        self.latency_history.append({"timestamp": ts, "value": round(base_latency, 1)})
        self.error_rate_history.append({"timestamp": ts, "value": round(error_rate, 2)})
        
        # System metrics
        self.cpu_history.append({
            "timestamp": ts,
            "api-server": round(random.gauss(45, 10), 1),
            "kafka-broker": round(random.gauss(35, 8), 1),
            "spark-worker": round(random.gauss(60, 15), 1),
            "model-svc": round(random.gauss(25, 5), 1),
        })
        self.memory_history.append({
            "timestamp": ts,
            "api-server": round(random.gauss(60, 5), 1),
            "kafka-broker": round(random.gauss(70, 8), 1),
            "spark-worker": round(random.gauss(80, 10), 1),
            "model-svc": round(random.gauss(40, 5), 1),
        })
        
        # Update prediction counts occasionally
        if random.random() < 0.3:
            outcomes = ["safe", "safe", "safe", "safe", "safe", "safe", "safe", "safe", "fraud", "review"]
            outcome = random.choice(outcomes)
            self.prediction_counts[outcome] += 1
            self.total_transactions += 1
    
    def _generate_log(self, tick: int):
        """Generate a realistic pipeline log entry"""
        log_types = [
            ("INFO", "spark-worker-{}".format(random.randint(1, 4)), 
             "Processed batch #{} ({} records, {}ms)".format(
                 random.randint(40000, 60000), random.randint(800, 1500), random.randint(100, 500))),
            ("INFO", "feature-store", 
             "Extracted {} features for user_id: {}".format(random.randint(35, 55), random.randint(1000, 9999))),
            ("INFO", "model-svc", 
             "Inference batch completed: {} txs in {}ms".format(random.randint(50, 200), random.randint(20, 80))),
            ("INFO", "kafka-consumer", 
             "Committed offsets for partition {}-{}".format(random.randint(0, 5), random.randint(100000, 999999))),
            ("INFO", "predictions", 
             "Flagged transaction TX-{} as {} (score: {:.2f})".format(
                 random.randint(1000, 9999), 
                 random.choice(["fraud", "review"]), 
                 random.uniform(0.65, 0.98))),
            ("WARN", "kafka-consumer", 
             "Consumer lag increasing: {} messages behind".format(random.randint(50, 300))),
            ("WARN", "spark-executor-{}".format(random.randint(1, 3)), 
             "GC pause {}ms (heap: {}MB)".format(random.randint(200, 800), random.randint(2048, 4096))),
            ("ERROR", "spark-executor-2", 
             "Task {} failed - Connection timeout to feature-store".format(random.randint(1, 100))),
            ("INFO", "data-source", 
             "Ingested {} transactions from stream '{}'".format(random.randint(500, 2000), random.choice(["user-events", "card-tx", "merchant-settlements"]))),
            ("INFO", "model-svc", 
             "Model v{} served prediction #{}".format("1.0.0", self.total_transactions)),
        ]
        
        weights = [0.2, 0.15, 0.15, 0.1, 0.1, 0.08, 0.08, 0.04, 0.08, 0.02]
        level, component, message = random.choices(log_types, weights=weights)[0]
        
        self.logs.append({
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "level": level,
            "component": component,
            "message": message
        })
    
    def _update_nodes(self, tick: int):
        """Update pipeline node metrics"""
        for node in self.nodes:
            if node["id"] == "data-source":
                node["throughput"] = max(200, int(self.throughput_history[-1]["value"]))
            elif node["id"] == "kafka":
                node["throughput"] = max(190, int(self.throughput_history[-1]["value"] * 0.998))
                node["lag"] = max(0, int(node.get("lag", 50) + random.gauss(0, 10)))
            elif node["id"] == "spark":
                node["throughput"] = max(180, int(self.throughput_history[-1]["value"] * 0.94))
                node["executor"] = "{}/3".format(random.randint(2, 3))
            elif node["id"] == "feature-store":
                node["throughput"] = max(180, int(self.throughput_history[-1]["value"] * 0.94))
                node["latency"] = "{}ms".format(random.randint(8, 20))
            elif node["id"] == "model":
                node["throughput"] = max(180, int(self.throughput_history[-1]["value"] * 0.94))
                node["latency"] = "{}ms".format(random.randint(25, 70))
            elif node["id"] == "predictions":
                node["throughput"] = max(180, int(self.throughput_history[-1]["value"] * 0.94))
    
    def _maybe_generate_alert(self):
        """Randomly generate alerts"""
        if random.random() < 0.15:  # 15% chance every 10 ticks
            alert_types = [
                ("warning", "kafka", "Consumer lag exceeds threshold ({} messages)".format(random.randint(100, 500))),
                ("critical", "spark", "Executor {} out of memory".format(random.randint(1, 3))),
                ("warning", "model", "Inference latency p99 > {}ms".format(random.randint(100, 300))),
                ("info", "pipeline", "Daily feature backfill completed successfully"),
                ("warning", "feature-store", "Feature drift detected in '{}'".format(random.choice(["amount_log", "tx_velocity", "merchant_risk_score"]))),
                ("critical", "api", "API error rate > 5% for 2 minutes"),
            ]
            severity, component, message = random.choice(alert_types)
            
            alert = {
                "id": "ALT-{:03d}".format(random.randint(100, 999)),
                "severity": severity,
                "component": component,
                "message": message,
                "timestamp": datetime.now().isoformat(),
                "resolved": False
            }
            self.alerts.insert(0, alert)
            
            # Keep max 100 alerts
            if len(self.alerts) > 100:
                self.alerts = self.alerts[:100]
    
    def _update_dag_states(self):
        """Update DAG task states"""
        for dag_id, dag_state in self.dag_states.items():
            # Randomly progress some tasks
            for task_id, task_state in dag_state["task_states"].items():
                if task_state["status"] == "queued" and random.random() < 0.3:
                    task_state["status"] = "running"
                    task_state["start_time"] = datetime.now().isoformat()
                elif task_state["status"] == "running":
                    if random.random() < 0.4:
                        task_state["status"] = "success"
                        task_state["duration"] = "{}s".format(random.randint(10, 300))
                    elif random.random() < 0.05:
                        task_state["status"] = "failed"
                        task_state["duration"] = "{}s".format(random.randint(5, 60))
                        task_state["retry_count"] += 1
                elif task_state["status"] == "failed" and task_state["retry_count"] < 3:
                    if random.random() < 0.3:
                        task_state["status"] = "running"
    
    # ─── Public API Methods ──────────────────────────────────────────────────
    
    def get_current_metrics(self) -> dict:
        with self._lock:
            if not self.throughput_history:
                return {"throughput": 0, "latency": 0, "error_rate": 0}
            return {
                "throughput": round(self.throughput_history[-1]["value"], 1),
                "latency": round(self.latency_history[-1]["value"], 1),
                "error_rate": round(self.error_rate_history[-1]["value"], 2),
                "total_transactions": self.total_transactions,
                "uptime_seconds": (datetime.now() - self.start_time).total_seconds()
            }
    
    def get_throughput_history(self, hours: int = 1) -> List[dict]:
        with self._lock:
            cutoff = datetime.now() - timedelta(hours=hours)
            return [m for m in self.throughput_history if m["timestamp"] > cutoff.isoformat()]
    
    def get_latency_history(self, hours: int = 1) -> List[dict]:
        with self._lock:
            cutoff = datetime.now() - timedelta(hours=hours)
            return [m for m in self.latency_history if m["timestamp"] > cutoff.isoformat()]
    
    def get_error_rate_history(self, hours: int = 1) -> List[dict]:
        with self._lock:
            cutoff = datetime.now() - timedelta(hours=hours)
            return [m for m in self.error_rate_history if m["timestamp"] > cutoff.isoformat()]
    
    def get_recent_logs(self, limit: int = 100) -> List[dict]:
        with self._lock:
            return list(self.logs)[-limit:]
    
    def get_prediction_distribution(self) -> dict:
        with self._lock:
            total = sum(self.prediction_counts.values())
            if total == 0:
                return {"fraud": 0, "safe": 0, "review": 0}
            return {
                k: {"count": v, "percentage": round(v / total * 100, 1)}
                for k, v in self.prediction_counts.items()
            }
    
    def get_node_status(self) -> List[dict]:
        with self._lock:
            return [dict(n) for n in self.nodes]
    
    def get_pipeline_edges(self) -> List[dict]:
        with self._lock:
            return [dict(e) for e in self.edges]
    
    def get_dags(self) -> List[dict]:
        with self._lock:
            return [
                {
                    "id": d["id"],
                    "name": d["name"],
                    "schedule": d["schedule"],
                    "owner": d["owner"],
                    "status": self.dag_states[d["id"]]["status"],
                    "last_run": self.dag_states[d["id"]]["last_run"],
                    "next_run": self.dag_states[d["id"]]["next_run"],
                    "run_count": self.dag_states[d["id"]]["run_count"],
                }
                for d in self.dags
            ]
    
    def get_dag_status(self, dag_id: str) -> Optional[dict]:
        with self._lock:
            if dag_id not in self.dag_states:
                return None
            return self.dag_states[dag_id]
    
    def trigger_dag(self, dag_id: str) -> bool:
        with self._lock:
            if dag_id not in self.dag_states:
                return False
            dag = self.dag_states[dag_id]
            dag["status"] = "running"
            dag["run_count"] += 1
            dag["last_run"] = datetime.now().isoformat()
            dag["active_run"] = str(uuid.uuid4())[:8]
            # Reset all tasks to queued
            for task_id in dag["task_states"]:
                dag["task_states"][task_id] = {
                    "status": "queued",
                    "start_time": None,
                    "duration": None,
                    "retry_count": 0,
                    "logs": []
                }
            # Set first tasks to running
            dag_def = next((d for d in self.dags if d["id"] == dag_id), None)
            if dag_def:
                for task in dag_def["tasks"]:
                    if not task["dependencies"]:
                        dag["task_states"][task["id"]]["status"] = "running"
                        dag["task_states"][task["id"]]["start_time"] = datetime.now().isoformat()
            return True
    
    def get_cpu_metrics(self) -> List[dict]:
        with self._lock:
            return list(self.cpu_history)[-60:]
    
    def get_memory_metrics(self) -> List[dict]:
        with self._lock:
            return list(self.memory_history)[-60:]
    
    def get_disk_metrics(self) -> dict:
        return {
            "total_gb": 500,
            "used_gb": round(random.gauss(320, 10), 1),
            "free_gb": round(random.gauss(180, 10), 1),
            "usage_percent": round(random.gauss(64, 2), 1)
        }
    
    def get_network_metrics(self) -> dict:
        return {
            "in_mbps": round(random.gauss(45, 10), 1),
            "out_mbps": round(random.gauss(30, 8), 1),
            "connections": random.randint(200, 500)
        }
    
    def get_kafka_topics(self) -> List[dict]:
        return [
            {"name": "raw-transactions", "partitions": 6, "replication": 3, "messages_per_sec": int(self.throughput_history[-1]["value"]) if self.throughput_history else 1200},
            {"name": "processed-features", "partitions": 4, "replication": 3, "messages_per_sec": int(self.throughput_history[-1]["value"] * 0.94) if self.throughput_history else 1130},
            {"name": "prediction-scores", "partitions": 3, "replication": 3, "messages_per_sec": int(self.throughput_history[-1]["value"] * 0.3) if self.throughput_history else 360},
            {"name": "alerts", "partitions": 2, "replication": 3, "messages_per_sec": random.randint(5, 20)},
        ]
    
    def get_consumer_groups(self) -> List[dict]:
        return [
            {"group": "spark-streaming", "topic": "raw-transactions", "lag": random.randint(20, 100), "members": 3},
            {"group": "feature-consumer", "topic": "processed-features", "lag": random.randint(5, 50), "members": 2},
            {"group": "prediction-consumer", "topic": "prediction-scores", "lag": random.randint(0, 20), "members": 2},
        ]
    
    def get_broker_metrics(self) -> List[dict]:
        return [
            {"id": "broker-1", "leader_count": 8, "replica_count": 15, "isr_count": 15, "disk_usage": round(random.gauss(65, 5), 1)},
            {"id": "broker-2", "leader_count": 7, "replica_count": 15, "isr_count": 15, "disk_usage": round(random.gauss(62, 5), 1)},
            {"id": "broker-3", "leader_count": 7, "replica_count": 15, "isr_count": 15, "disk_usage": round(random.gauss(63, 5), 1)},
        ]
    
    def get_spark_apps(self) -> List[dict]:
        return [
            {"id": "app-001", "name": "FraudDetectionStream", "status": "running", "duration": "2d 4h", "executors": 3, "tasks": 24},
            {"id": "app-002", "name": "FeatureEngineering", "status": "running", "duration": "5d 12h", "executors": 2, "tasks": 12},
            {"id": "app-003", "name": "DailyBatchETL", "status": "completed", "duration": "45m", "executors": 0, "tasks": 0},
        ]
    
    def get_executor_metrics(self) -> List[dict]:
        return [
            {"id": "exec-1", "host": "worker-1", "tasks": random.randint(5, 15), "memory_used": round(random.gauss(6.2, 0.5), 1), "memory_total": 8, "cpu": round(random.gauss(65, 10), 1)},
            {"id": "exec-2", "host": "worker-2", "tasks": random.randint(5, 15), "memory_used": round(random.gauss(7.1, 0.5), 1), "memory_total": 8, "cpu": round(random.gauss(75, 10), 1)},
            {"id": "exec-3", "host": "worker-3", "tasks": random.randint(3, 10), "memory_used": round(random.gauss(5.5, 0.5), 1), "memory_total": 8, "cpu": round(random.gauss(55, 10), 1)},
        ]
    
    def get_stage_metrics(self) -> List[dict]:
        return [
            {"id": "stage-42", "name": "mapPartitions", "status": "active", "tasks": "18/24", "duration": "12s"},
            {"id": "stage-41", "name": "kafka-source", "status": "completed", "tasks": "6/6", "duration": "3s"},
            {"id": "stage-40", "name": "feature-join", "status": "completed", "tasks": "12/12", "duration": "8s"},
        ]
    
    def get_alerts(self) -> List[dict]:
        with self._lock:
            return list(self.alerts)
    
    def resolve_alert(self, alert_id: str) -> bool:
        with self._lock:
            for alert in self.alerts:
                if alert["id"] == alert_id:
                    alert["resolved"] = True
                    return True
            return False
