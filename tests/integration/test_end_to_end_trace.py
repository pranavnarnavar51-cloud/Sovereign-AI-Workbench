"""
Integration Test: End-to-End Multi-Agent Diagnostic Workflow & HITL Verification
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents.orchestrator.state import WorkflowState
from agents.graph.langgraph_workflow import sovereign_workflow

def test_full_maintenance_agent_loop():
    query = "Run diagnostic on Boiler Feed Pump P-104 vibration harmonics and check if trip is needed."
    state = WorkflowState(
        session_id="test-session-001",
        user_query=query
    )

    final_state = sovereign_workflow.execute_workflow(state)

    # 1. Verify guardrail passed
    assert final_state.guardrail_verdict["status"] == "PASS"

    # 2. Verify routed to maintenance
    assert final_state.assigned_specialist == "maintenance_agent"

    # 3. Verify tools were invoked
    tool_names = [t["tool"] for t in final_state.tool_executions]
    assert "sql_telemetry_runner" in tool_names
    assert "compliance_rule_engine" in tool_names

    # 4. Verify HITL gatekeeper triggered due to Zone D breach
    assert final_state.hitl_required is True
    assert final_state.hitl_action_proposal is not None
    assert final_state.hitl_action_proposal["priority"] == "EMERGENCY_TIER_1"

    # 5. Verify factual grounding
    assert final_state.verification_score > 0.90
