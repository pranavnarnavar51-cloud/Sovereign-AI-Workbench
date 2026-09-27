"""
Agent Retry & Self-Correction Policy
If verification score drops below threshold, triggers structured re-prompting with manual constraints.
"""
from typing import Dict, Any
from agents.orchestrator.state import WorkflowState

class RetryPolicy:
    def evaluate_retry(self, state: WorkflowState, max_retries: int = 2) -> bool:
        if state.verification_score < 0.75:
            state.audit_trace.append({
                "step": "RETRY_TRIGGERED",
                "reason": f"Verification score {state.verification_score} below acceptable threshold 0.75"
            })
            return True
        return False

retry_policy = RetryPolicy()
