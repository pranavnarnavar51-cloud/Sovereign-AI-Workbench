"""
LangGraph Coordinated Multi-Agent Workflow
Coordinates state progression through Planner, Specialist Agents, MCP Tools, Verification Engine, and HITL Gate.
"""
from typing import Dict, Any
from agents.orchestrator.state import WorkflowState
from agents.orchestrator.planner_agent import planner_agent
from agents.maintenance_agent.agent import maintenance_agent
from agents.quality_agent.agent import quality_agent
from agents.safety_agent.agent import safety_agent
from agents.engineering_agent.agent import engineering_agent
from agents.verification.verification_engine import verification_engine

class SovereignAgentWorkflow:
    def execute_workflow(self, state: WorkflowState) -> WorkflowState:
        # Step 1: Planner & Security Guardrails
        state = planner_agent.plan_and_route(state)

        # If blocked by guardrail, return immediately
        if state.guardrail_verdict.get("status") == "REJECTED":
            return state

        # Step 2: Route to Specialist Agent
        specialist = state.assigned_specialist
        if specialist == "maintenance_agent":
            state = maintenance_agent.process(state)
        elif specialist == "quality_agent":
            state = quality_agent.process(state)
        elif specialist == "safety_agent":
            state = safety_agent.process(state)
        elif specialist == "engineering_agent":
            state = engineering_agent.process(state)
        else:
            state = maintenance_agent.process(state)

        # Step 3: Verification & Grounding Check
        state = verification_engine.verify_state(state)

        return state

sovereign_workflow = SovereignAgentWorkflow()
