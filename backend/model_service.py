"""
ML Model Service - Loads and serves the fraud detection model
"""

import json
import os
import time
from typing import Dict, List, Optional

import numpy as np
import joblib


class ModelService:
    """Service for loading and using the fraud detection model"""
    
    def __init__(self, model_path: str, scaler_path: str, metadata_path: str):
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
        
        self.feature_names = self.metadata["features"]
        self.prediction_count = 0
        self.prediction_times = []
    
    def _extract_features(self, tx_data: dict) -> np.ndarray:
        """Extract and engineer features from raw transaction data"""
        amount = tx_data["amount"]
        avg_amount_7d = tx_data["avg_amount_7d"]
        time_since_last_tx = tx_data["time_since_last_tx"]
        transaction_count_1h = tx_data["transaction_count_1h"]
        hour_of_day = tx_data["hour_of_day"]
        
        # Derived features
        amount_to_avg_ratio = amount / (avg_amount_7d + 1)
        tx_velocity = transaction_count_1h / (time_since_last_tx + 1) * 3600
        high_risk_hour = 1 if (0 <= hour_of_day <= 5) else 0
        amount_log = np.log1p(amount)
        
        risk_composite = (
            tx_data["merchant_risk_score"] * 0.3 +
            tx_data["is_new_device"] * 0.25 +
            tx_data["is_new_location"] * 0.2 +
            (1 - tx_data["card_present"]) * 0.15 +
            high_risk_hour * 0.1
        )
        
        feature_vector = [
            amount,
            hour_of_day,
            tx_data["day_of_week"],
            transaction_count_1h,
            tx_data["transaction_count_24h"],
            avg_amount_7d,
            tx_data["unique_merchants_7d"],
            tx_data["card_present"],
            tx_data["merchant_risk_score"],
            tx_data["distance_from_home"],
            time_since_last_tx,
            tx_data["is_new_device"],
            tx_data["is_new_location"],
            amount_to_avg_ratio,
            tx_velocity,
            high_risk_hour,
            amount_log,
            risk_composite
        ]
        
        return np.array(feature_vector).reshape(1, -1)
    
    def predict(self, tx_data: dict) -> dict:
        """Run prediction on a single transaction"""
        start = time.time()
        
        features = self._extract_features(tx_data)
        features_scaled = self.scaler.transform(features)
        
        prediction = self.model.predict(features_scaled)[0]
        fraud_proba = self.model.predict_proba(features_scaled)[0]
        
        fraud_score = float(fraud_proba[1])
        confidence = float(max(fraud_proba))
        
        self.prediction_count += 1
        self.prediction_times.append(time.time() - start)
        
        # Keep only last 1000 timing samples
        if len(self.prediction_times) > 1000:
            self.prediction_times = self.prediction_times[-1000:]
        
        return {
            "prediction": int(prediction),
            "fraud_score": round(fraud_score, 4),
            "confidence": round(confidence, 4),
            "features_used": self.feature_names,
            "probabilities": {
                "safe": round(float(fraud_proba[0]), 4),
                "fraud": round(fraud_score, 4)
            }
        }
    
    def get_metadata(self) -> dict:
        """Get model metadata and runtime stats"""
        avg_latency = np.mean(self.prediction_times) * 1000 if self.prediction_times else 0
        
        return {
            **self.metadata,
            "runtime_stats": {
                "total_predictions": self.prediction_count,
                "avg_latency_ms": round(avg_latency, 2),
                "p99_latency_ms": round(np.percentile(self.prediction_times, 99) * 1000, 2) if self.prediction_times else 0
            }
        }
    
    def get_feature_importance(self) -> List[dict]:
        """Get feature importance as a sorted list"""
        importance = self.metadata.get("feature_importance", {})
        sorted_features = sorted(
            [{"feature": k, "importance": v} for k, v in importance.items()],
            key=lambda x: x["importance"],
            reverse=True
        )
        return sorted_features
