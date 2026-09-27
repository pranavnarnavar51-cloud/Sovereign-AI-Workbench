"""
Operations Planner & Orchestrator Agent
Decomposes complex industrial challenges into DAG sub-tasks and coordinates specialist execution.
"""
from typing import Dict, Any, List
from agents.orchestrator.state import WorkflowState
from agents.orchestrator.task_router import task_router
from gateway.guardrails.prompt_injection_filter import prompt_filter
from gateway.guardrails.pii_secrets_scrubber import pii_scrubber

class OperationsPlannerAgent:
    def plan_and_route(self, state: WorkflowState) -> WorkflowState:
        # 1. Security Guardrail Evaluation
        is_safe, score, reason = prompt_filter.evaluate(state.user_query)
        clean_text, redacted_count = pii_scrubber.scrub(state.user_query)

        state.guardrail_verdict = {
            "is_safe": is_safe,
            "injection_risk": score,
            "pii_redactions": redacted_count,
            "status": "PASS" if is_safe else "REJECTED"
        }

        if not is_safe:
            state.final_response = f"⛔ [SECURITY GATEWAY BLOCKED]: {reason}"
            state.audit_trace.append({"step": "GUARDRAIL_INTERCEPTION", "detail": reason})
            return state

        # 2. Determine Specialist Agent Domain
        has_imgs = len([a for a in state.multimodal_attachments if a.get("type") == "image"]) > 0
        has_cad = len([a for a in state.multimodal_attachments if a.get("type") == "cad"]) > 0
        specialist = task_router.route_query(clean_text, has_images=has_imgs, has_cad=has_cad)
        state.assigned_specialist = specialist

        # 3. Formulate Action Plan
        state.plan_steps = [
            f"Pass security filter and normalize telemetry parameters (OWASP LLM01/02)",
            f"Dispatch query to domain specialist: [{specialist.upper()}]",
            f"Execute local MCP tool servers within air-gapped container boundaries",
            f"Run factuality and boundary verification check",
            f"Check if Human-in-the-Loop (HITL) gatekeeper signoff is required"
        ]

        state.audit_trace.append({
            "step": "PLANNER_DISPATCH",
            "specialist": specialist,
            "plan_length": len(state.plan_steps)
        })

        return state

planner_agent = OperationsPlannerAgent()
