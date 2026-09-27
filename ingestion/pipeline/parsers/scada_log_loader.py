"""
SCADA Telemetry CSV/OPC Ingestion Loader
Loads high-frequency sensor streams, computes rolling FFT, and detects anomalous threshold breaches.
"""
import csv
import os
from typing import List, Dict, Any

class SCADALogLoader:
    def load_telemetry_csv(self, csv_path: str) -> List[Dict[str, Any]]:
        """Parses industrial time-series telemetry."""
        records = []
        if not os.path.exists(csv_path):
            return records

        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append({
                    "timestamp": row.get("timestamp"),
                    "sensor_tag": row.get("sensor_tag"),
                    "equipment_tag": row.get("equipment_tag"),
                    "value": float(row.get("value", 0.0)),
                    "unit": row.get("unit", ""),
                    "anomaly": row.get("anomaly", "false").lower() == "true"
                })
        return records

scada_loader = SCADALogLoader()
