"""
Typed Workflow State for Sovereign Multi-Agent Orchestration
Maintains session context, intermediate tool findings, guardrail scores, and HITL gate state.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class AgentMessage(BaseModel):
    sender: str
    role: str # "user", "assistant", "system", "tool"
    content: str
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None

class WorkflowState(BaseModel):
    session_id: str
    clearance_level: str = "SECRET_LEVEL_4"
    user_query: str
    multimodal_attachments: List[Dict[str, Any]] = Field(default_factory=list)
    guardrail_verdict: Dict[str, Any] = Field(default_factory=dict)
    assigned_specialist: str = "orchestrator"
    plan_steps: List[str] = Field(default_factory=list)
    tool_executions: List[Dict[str, Any]] = Field(default_factory=list)
    evidence_bundle: Dict[str, Any] = Field(default_factory=dict)
    verification_score: float = 1.0
    hitl_required: bool = False
    hitl_action_proposal: Optional[Dict[str, Any]] = None
    final_response: Optional[str] = None
    audit_trace: List[Dict[str, Any]] = Field(default_factory=list)
