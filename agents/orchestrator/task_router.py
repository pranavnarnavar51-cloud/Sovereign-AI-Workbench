"""
Task Router for Sovereign Agentic Workbench
Determines which specialist agent domain should handle incoming requests.
"""
from typing import Dict, Any

class TaskRouter:
    def route_query(self, query: str, has_images: bool = False, has_cad: bool = False) -> str:
        q_lower = query.lower()

        if has_images or "weld" in q_lower or "xray" in q_lower or "defect" in q_lower or "crack" in q_lower:
            return "quality_agent"

        if has_cad or "drawing" in q_lower or "tolerance" in q_lower or "cad" in q_lower or "schematic" in q_lower:
            return "engineering_agent"

        if "osha" in q_lower or "safety" in q_lower or "hazard" in q_lower or "loto" in q_lower or "leak" in q_lower:
            return "safety_agent"

        # Default to maintenance agent for vibration, telemetry, bearing, motor, pump queries
        return "maintenance_agent"

task_router = TaskRouter()
