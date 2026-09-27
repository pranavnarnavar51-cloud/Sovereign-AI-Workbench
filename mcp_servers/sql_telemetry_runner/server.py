"""
SQL Telemetry Runner MCP Server
Safely queries time-series telemetry from local TimescaleDB.
"""
from typing import Dict, Any, List
import datetime

class SQLTelemetryRunnerServer:
    def query_telemetry(self, equipment_tag: str, time_window_minutes: int = 60) -> Dict[str, Any]:
        # High fidelity simulation of TimescaleDB time-series response
        base_time = datetime.datetime.now(datetime.timezone.utc)
        points = []
        
        # 12 points spanning the time window
        vib_trend = [3.1, 3.2, 3.4, 3.9, 4.5, 5.2, 5.9, 6.7, 7.3, 7.9, 8.2, 8.6]
        temp_trend = [62.0, 63.5, 65.0, 68.2, 71.0, 74.5, 78.0, 81.2, 84.5, 87.0, 88.5, 91.2]
        
        for i in range(12):
            t_stamp = (base_time - datetime.timedelta(minutes=(11 - i) * 5)).isoformat()
            points.append({
                "timestamp": t_stamp,
                "vibration_rms_de": vib_trend[i],
                "bearing_temp_c": temp_trend[i],
                "discharge_pressure_bar": round(112.0 + (i % 3) * 0.4, 2),
                "is_anomalous": vib_trend[i] > 7.1
            })

        return {
            "equipment_tag": equipment_tag,
            "status": "EVALUATED",
            "datapoints_count": len(points),
            "current_metrics": points[-1],
            "vibration_status": "ZONE_D_TRIP_CRITICAL" if points[-1]["vibration_rms_de"] > 7.1 else "ZONE_B_ACCEPTABLE",
            "telemetry_series": points
        }

sql_runner_server = SQLTelemetryRunnerServer()
