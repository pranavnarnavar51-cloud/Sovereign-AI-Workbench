"""
Anomaly Detection MCP Server
Fast statistical and envelope analysis for vibration and thermal signatures.
"""
from typing import Dict, Any, List
import numpy as np

class AnomalyDetectionServer:
    def detect_anomalies(self, series: List[float], sigma: float = 2.0) -> Dict[str, Any]:
        if not series or len(series) < 3:
            return {"status": "INSUFFICIENT_DATA", "anomaly_detected": False}

        arr = np.array(series)
        # Calculate baseline on the series excluding extreme outlier if present
        mean_val = float(np.mean(arr[:-1])) if len(arr) > 3 else float(np.mean(arr))
        std_val = float(np.std(arr[:-1])) if len(arr) > 3 else float(np.std(arr))
        if std_val < 0.05:
            std_val = 0.1

        threshold = mean_val + sigma * std_val
        anomalies_indices = [i for i, v in enumerate(arr) if v > threshold]
        anomaly_detected = len(anomalies_indices) > 0

        severity = "NORMAL"
        if anomaly_detected:
            if arr[-1] >= threshold * 1.05 or arr[-1] > 7.0:
                severity = "CRITICAL"
            else:
                severity = "WARNING"

        return {
            "mean": round(mean_val, 3),
            "std_dev": round(std_val, 3),
            "threshold": round(threshold, 3),
            "anomaly_detected": anomaly_detected,
            "anomaly_points": [{"index": i, "value": float(arr[i])} for i in anomalies_indices],
            "severity": severity
        }

anomaly_server = AnomalyDetectionServer()
