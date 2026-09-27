"""
Unit Tests for 7 Industrial MCP Tool Servers
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from mcp_servers.local_python_sandbox.server import sandbox_server
from mcp_servers.sql_telemetry_runner.server import sql_runner_server
from mcp_servers.anomaly_detection_invoke.server import anomaly_server
from mcp_servers.compliance_rule_engine.server import compliance_engine_server
from mcp_servers.work_order_draft.server import work_order_server

def test_sandbox_calculation():
    code = "result = math.sqrt(64) * 2"
    res = sandbox_server.execute_calculation(code)
    assert res["success"] is True
    assert res["result"] == 16.0

def test_sandbox_blocks_forbidden_import():
    code = "import os\nresult = os.listdir('.')"
    res = sandbox_server.execute_calculation(code)
    assert res["success"] is False
    assert "Security Policy Violation" in res["error"]

def test_sql_telemetry_runner():
    res = sql_runner_server.query_telemetry("BFP-P-104", 60)
    assert res["datapoints_count"] == 12
    assert "vibration_rms_de" in res["current_metrics"]

def test_anomaly_detection():
    series = [2.1, 2.3, 2.2, 2.4, 2.2, 8.8] # obvious spike
    res = anomaly_server.detect_anomalies(series, sigma=2.0)
    assert res["anomaly_detected"] is True
    assert res["severity"] == "CRITICAL"

def test_compliance_rule_engine():
    res = compliance_engine_server.evaluate_compliance("ISO_10816_3", {"vibration_velocity_rms": 8.4})
    assert "Zone D" in res["assigned_zone"]
    assert res["compliance_status"] == "CRITICAL_NON_COMPLIANCE"

def test_work_order_draft():
    wo = work_order_server.draft_order("BFP-P-104", "EMERGENCY_TIER_1", "Replace bearing")
    assert wo["status"] == "PENDING_HITL_APPROVAL"
    assert wo["hitl_gate_required"] is True
