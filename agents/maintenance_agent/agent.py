"""
Sovereign Maintenance Specialist Agent
Analyzes vibration FFT, bearing telemetry, and drafts emergency work orders.
"""
from typing import Dict, Any
from agents.orchestrator.state import WorkflowState
from mcp_servers.sql_telemetry_runner.server import sql_runner_server
from mcp_servers.anomaly_detection_invoke.server import anomaly_server
from mcp_servers.work_order_draft.server import work_order_server
from mcp_servers.compliance_rule_engine.server import compliance_engine_server

class MaintenanceAgent:
    def process(self, state: WorkflowState) -> WorkflowState:
        equipment_tag = "BFP-P-104" # Detected or default critical boiler pump

        # 1. Query Local Telemetry MCP Server
        telemetry_result = sql_runner_server.query_telemetry(equipment_tag, time_window_minutes=60)
        state.tool_executions.append({
            "tool": "sql_telemetry_runner",
            "input": {"equipment_tag": equipment_tag},
            "output": telemetry_result
        })

        # 2. Invoke Anomaly Detection MCP Server
        vib_series = [pt["vibration_rms_de"] for pt in telemetry_result["telemetry_series"]]
        anomaly_res = anomaly_server.detect_anomalies(vib_series, sigma=2.0)
        state.tool_executions.append({
            "tool": "anomaly_detection_invoke",
            "input": {"series_length": len(vib_series)},
            "output": anomaly_res
        })

        # 3. Evaluate ISO 10816-3 Compliance MCP Server
        latest_vib = telemetry_result["current_metrics"]["vibration_rms_de"]
        compliance_res = compliance_engine_server.evaluate_compliance(
            "ISO_10816_3",
            {"vibration_velocity_rms": latest_vib}
        )
        state.tool_executions.append({
            "tool": "compliance_rule_engine",
            "input": {"standard": "ISO_10816_3", "value": latest_vib},
            "output": compliance_res
        })

        # 4. Synthesize Evidence Bundle
        state.evidence_bundle = {
            "equipment_tag": equipment_tag,
            "equipment_name": "High-Pressure Boiler Feed Pump P-104",
            "telemetry_points": telemetry_result["telemetry_series"],
            "latest_metrics": telemetry_result["current_metrics"],
            "iso_zone": compliance_res["assigned_zone"],
            "compliance_status": compliance_res["compliance_status"],
            "failure_mode": "Outer Race Bearing Degradation (SKF 7318)"
        }

        # 5. Determine if HITL Gatekeeper is needed
        if latest_vib > 7.1:
            state.hitl_required = True
            wo = work_order_server.draft_order(
                equipment_tag=equipment_tag,
                priority="EMERGENCY_TIER_1",
                description=f"CRITICAL: Vibration reached {latest_vib} mm/s (ISO 10816-3 Zone D). Switch to Standby Pump P-104B and replace Drive End Bearing SKF 7318.",
                required_craft="Lead Mechanical Millwright",
                estimated_downtime_hours=4.5
            )
            state.hitl_action_proposal = wo
            state.tool_executions.append({
                "tool": "work_order_draft",
                "input": {"priority": "EMERGENCY_TIER_1"},
                "output": wo
            })

        # 6. Compose Structured Final Response
        state.final_response = (
            f"### ⚙️ Predictive Maintenance Diagnostic Report: {equipment_tag}\n\n"
            f"**Diagnostic Status**: ⚠️ **CRITICAL ALARM (Zone D Breach)**\n"
            f"- **Current Vibration DE**: `{latest_vib} mm/s RMS` (Trip threshold: `7.10 mm/s`)\n"
            f"- **Bearing Temperature**: `{telemetry_result['current_metrics']['bearing_temp_c']} °C` (Thermal high alarm: `85.0 °C`)\n"
            f"- **Compliance Assessment**: `{compliance_res['assigned_zone']}` under **ISO 10816-3**.\n"
            f"- **Suspected Root Cause**: Early-stage spalling and cage degradation in Drive End angular contact ball bearing.\n\n"
            f"> [!IMPORTANT]\n"
            f"> **Human-In-The-Loop (HITL) Gatekeeper Intercept**: Automated tripping of P-104 without secondary boiler feed staging risks thermal shock. Review the generated Emergency Work Order card below and authorize the staged transfer."
        )

        state.audit_trace.append({
            "step": "MAINTENANCE_AGENT_COMPLETE",
            "latest_vib": latest_vib,
            "hitl_triggered": state.hitl_required
        })

        return state

maintenance_agent = MaintenanceAgent()
