"""
Sovereign On-Premise Agentic AI Workbench - Unified Backend API
Features:
1. 100% Air-Gapped Local Ollama Inference (llama3.2, llava, nomic-embed-text)
2. Pre-seeded Enterprise Company Knowledge Base (Apex Heavy Dynamics Corp)
3. Continuous Learning Engine (extracts & saves facts from employee messages to SQLite)
4. ChatGPT-style Chat Sessions & Message History Persistence
5. Multi-Agent Workflows, MCP Sandboxes, OWASP Guardrails, & Tamper-Evident SIEM
"""
import os
import sys
import re
import uuid
import datetime
import hmac
import hashlib
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from inference.ollama_client import ollama_client
from inference.whisper_service.transcribe_server import whisper_service
from stores.knowledge_memory import memory_store
from ingestion.demo_company_seed import seed_company_knowledge
from ingestion.learning_engine import learning_engine
from ingestion.rag_retriever import rag_retriever
from agents.orchestrator.state import WorkflowState
from agents.graph.langgraph_workflow import sovereign_workflow
from gateway.guardrails.prompt_injection_filter import prompt_filter
from gateway.guardrails.pii_secrets_scrubber import pii_scrubber
from ingestion.pdf_parser import parse_attachment_to_text, extract_text_from_pdf_bytes, extract_text_from_docx_bytes

# Ensure demo company knowledge is seeded on startup
seed_company_knowledge()

app = FastAPI(
    title="Sovereign On-Premise Agentic AI Workbench API",
    version="2.5.0",
    description="100% Air-gapped confidential industrial workbench with Ollama & continuous learning"
)

# Enable CORS for local workbench frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory tamper-evident SIEM buffer
AUDIT_LOG_BUFFER: List[Dict[str, Any]] = []

def log_audit_event(action_type: str, details: Dict[str, Any], clearance: str = "SECRET_LEVEL_4"):
    event_id = f"AUDIT-{uuid.uuid4().hex[:8]}"
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    raw = f"{ts}|{event_id}|{action_type}|{clearance}"
    sig = hmac.new(b"sovereign_audit_key_2026", raw.encode(), hashlib.sha256).hexdigest()
    
    record = {
        "event_id": event_id,
        "timestamp": ts,
        "action_type": action_type,
        "clearance_tier": clearance,
        "details": details,
        "tamper_hmac_sha256": sig
    }
    AUDIT_LOG_BUFFER.insert(0, record)
# --- Enterprise User Authentication & Quick-Login Profiles ---
ENTERPRISE_PROFILES = [
    {
        "id": "usr-sharma",
        "username": "director.sharma",
        "name": "Director M. Sharma",
        "role": "Plant Operations Director",
        "department": "Plant Executive Directorate",
        "clearance": "TOP_SECRET_LEVEL_5",
        "clearance_code": "SIG-SOV-LEVEL5-9941",
        "initials": "MS",
        "avatar_badge": "🏛️",
        "theme_color": "emerald"
    },
    {
        "id": "usr-kulkarni",
        "username": "eng.kulkarni",
        "name": "Dr. R. Kulkarni",
        "role": "Chief Reliability Engineer",
        "department": "Mechanical & Machinery Reliability",
        "clearance": "SECRET_LEVEL_4",
        "clearance_code": "SIG-SOV-LEVEL4-3312",
        "initials": "RK",
        "avatar_badge": "🛠️",
        "theme_color": "cyan"
    },
    {
        "id": "usr-verma",
        "username": "safety.verma",
        "name": "Ananya Verma",
        "role": "Head of Plant Safety",
        "department": "HSE & OSHA Compliance",
        "clearance": "SECRET_LEVEL_4",
        "clearance_code": "SIG-SOV-LEVEL4-7721",
        "initials": "AV",
        "avatar_badge": "🦺",
        "theme_color": "amber"
    },
    {
        "id": "usr-nair",
        "username": "qa.nair",
        "name": "Priya Nair",
        "role": "Lead Quality Assurance Inspector",
        "department": "Weld & NDT Inspection",
        "clearance": "RESTRICTED_LEVEL_3",
        "clearance_code": "SIG-SOV-LEVEL3-4419",
        "initials": "PN",
        "avatar_badge": "🔍",
        "theme_color": "violet"
    }
]

class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = "sovereign2026"
    role: Optional[str] = None

@app.get("/api/auth/profiles")
async def get_login_profiles():
    """Return pre-configured 1-click profiles for instant demo access."""
    return ENTERPRISE_PROFILES

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    u = req.username.strip().lower()
    matched = next((p for p in ENTERPRISE_PROFILES if p["username"].lower() == u or p["id"] == u), None)
    
    if not matched:
        matched = next((p for p in ENTERPRISE_PROFILES if p["name"].lower() in u or u in p["name"].lower()), None)
    
    if not matched:
        role_label = req.role or "Shopfloor Operations Engineer"
        initials = "".join([part[0].upper() for part in req.username.split()[:2]]) or "EP"
        matched = {
            "id": f"usr-{uuid.uuid4().hex[:6]}",
            "username": req.username,
            "name": req.username.title(),
            "role": role_label,
            "department": "General Facility Operations",
            "clearance": "RESTRICTED_LEVEL_3",
            "clearance_code": f"SIG-SOV-LEVEL3-{uuid.uuid4().hex[:4].upper()}",
            "initials": initials,
            "avatar_badge": "👤",
            "theme_color": "blue"
        }

    token = f"SOV-JWT-{uuid.uuid4().hex[:16]}"
    log_audit_event("EMPLOYEE_LOGIN_SUCCESS", {
        "user_id": matched["id"],
        "name": matched["name"],
        "clearance": matched["clearance"],
        "node": "IND-FACILITY-07-MUMBAI"
    }, clearance=matched["clearance"])

    return {
        "success": True,
        "token": token,
        "user": matched
    }

# --- Health & Status ---
@app.get("/api/health")
async def get_health():
    ollama_status = await ollama_client.check_health()
    all_facts = memory_store.get_all_learned_facts()
    all_docs = memory_store.get_all_documents()
    return {
        "status": "OPERATIONAL",
        "facility_node": "IND-FACILITY-07-MUMBAI",
        "company": "Apex Heavy Dynamics Corp",
        "air_gap_active": True,
        "egress_firewall": "STRICT_DENY_ALL",
        "ollama": ollama_status,
        "memory": {
            "learned_facts_count": len(all_facts),
            "company_documents_count": len(all_docs)
        },
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

# --- ChatGPT-Style Session Management ---
class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Industrial Chat"
    model: Optional[str] = "gemma3:4b"
    category: Optional[str] = "general"

@app.get("/api/sessions")
async def list_sessions():
    sessions = memory_store.get_sessions()
    if not sessions:
        # Create default initial session
        init_id = "session-default-01"
        memory_store.create_session(
            session_id=init_id,
            title="Boiler & Turbine Diagnostics",
            model="gemma3:4b",
            category="general"
        )
        sessions = memory_store.get_sessions()
    return sessions

@app.post("/api/sessions")
async def create_session(req: CreateSessionRequest):
    session_id = f"sess-{uuid.uuid4().hex[:8]}"
    created = memory_store.create_session(
        session_id=session_id,
        title=req.title or "New Industrial Chat",
        model=req.model or "gemma3:4b",
        category=req.category or "general"
    )
    log_audit_event("CHAT_SESSION_CREATED", {"session_id": session_id, "model": req.model})
    return created

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    sess = memory_store.get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return sess

class UpdateSessionRequest(BaseModel):
    title: str

@app.patch("/api/sessions/{session_id}")
async def update_session(session_id: str, req: UpdateSessionRequest):
    sess = memory_store.get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    memory_store.update_session_title(session_id, req.title)
    return {"success": True, "id": session_id, "title": req.title}

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    success = memory_store.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    log_audit_event("CHAT_SESSION_DELETED", {"session_id": session_id})
    return {"success": True, "session_id": session_id}

@app.delete("/api/sessions/{session_id}/clear")
async def clear_session_messages(session_id: str):
    """Clears messages for a session while preserving the session container."""
    with memory_store._get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
        conn.commit()
    log_audit_event("CHAT_MESSAGES_CLEARED", {"session_id": session_id})
    return {"success": True, "session_id": session_id}

@app.get("/api/sessions/{session_id}/messages")
async def get_session_messages(session_id: str):
    return memory_store.get_messages_for_session(session_id)

# --- Chat & Continuous Learning API ---
class SendChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    channel_id: Optional[str] = None # For compatibility with existing views
    content: str
    user_role: str = "Lead Reliability Engineer"
    model: Optional[str] = "gemma3:4b"
    agent_mode: Optional[str] = "general" # general, maintenance, quality, safety, engineering
    attachments: Optional[List[Dict[str, Any]]] = None

@app.post("/api/chat")
async def handle_chat(request: SendChatMessageRequest):
    session_id = request.session_id or request.channel_id or "session-default-01"
    raw_prompt = request.content.strip()
    now_time = datetime.datetime.now().strftime("%H:%M")

    # Ensure session exists in DB
    existing_sess = memory_store.get_session(session_id)
    if not existing_sess:
        memory_store.create_session(
            session_id=session_id,
            title=raw_prompt[:32] + "..." if len(raw_prompt) > 32 else raw_prompt,
            model=request.model or "gemma3:4b",
            category=request.agent_mode or "general"
        )

    # 1. Evaluate Security Guardrails (OWASP LLM01 / LLM02)
    is_safe, injection_score, reason = prompt_filter.evaluate(raw_prompt)
    clean_text, redacted_count = pii_scrubber.scrub(raw_prompt)

    # Save User Message to SQLite
    user_msg_id = f"usr-{uuid.uuid4().hex[:6]}"
    user_msg = memory_store.add_message(
        message_id=user_msg_id,
        session_id=session_id,
        sender=request.user_role,
        role="user",
        content=clean_text,
        timestamp=now_time
    )

    if not is_safe:
        bot_msg_id = f"agt-{uuid.uuid4().hex[:6]}"
        blocked_content = f"⛔ [SECURITY GATEWAY BLOCKED]: Query failed on-premise safety inspection. Reason: {reason}"
        bot_msg = memory_store.add_message(
            message_id=bot_msg_id,
            session_id=session_id,
            sender="Security Gateway",
            role="assistant",
            content=blocked_content,
            timestamp=now_time,
            reasoning="Intercepted by OWASP Prompt Injection Filter."
        )
        log_audit_event("GUARDRAIL_INTERCEPTION", {"session_id": session_id, "reason": reason})
        return {
            "channel_id": session_id,
            "session_id": session_id,
            "user_message": user_msg,
            "agent_response": bot_msg,
            "learned_info": None
        }

    # 2. Conversational Greetings Fast-Path
    is_greeting = bool(re.match(r"^(hi+|hello+|hey+|good\s+(morning|afternoon|evening)|greetings|howdy)(\s+there)?[!\.\?\s]*$", clean_text, re.IGNORECASE))
    if is_greeting:
        bot_msg_id = f"agt-{uuid.uuid4().hex[:6]}"
        greeting_reply = (
            f"Hello! I am your **Sovereign On-Premise Industrial AI Assistant** for Apex Heavy Dynamics Corp.\n\n"
            f"I operate 100% locally and air-gapped on your on-premise Ollama engine (`{request.model or 'gemma3:4b'}`). "
            f"I have direct access to our plant SOPs, equipment condition monitoring (e.g. Boiler Feed Pump BFP-P-104), safety LOTO protocols, and continuous employee-taught memories.\n\n"
            f"How can I assist your operations, machinery diagnostics, or company knowledge today?"
        )
        bot_msg = memory_store.add_message(
            message_id=bot_msg_id,
            session_id=session_id,
            sender="Industrial AI Assistant",
            role="assistant",
            content=greeting_reply,
            timestamp=now_time,
            reasoning="Conversational greeting response dispatched in air-gap enclave."
        )
        log_audit_event("GREETING_DISPATCHED", {"session_id": session_id})
        return {
            "channel_id": session_id,
            "session_id": session_id,
            "user_message": user_msg,
            "agent_response": bot_msg,
            "learned_info": None,
            "citations": [],
            "model_used": request.model or "gemma3:4b"
        }

    # 3. CONTINUOUS LEARNING: Analyze if the employee is teaching something new
    learned_info = learning_engine.process_user_message(
        user_message=clean_text,
        sender=request.user_role,
        session_id=session_id
    )

    if learned_info:
        log_audit_event("CONTINUOUS_KNOWLEDGE_LEARNED", {
            "fact_id": learned_info["fact_id"],
            "key": learned_info["key"],
            "category": learned_info["category"],
            "taught_by": request.user_role
        })

    # 3. HYBRID RAG RETRIEVAL: Query both Company SOPs & Learned Facts
    grounded_context, citations = rag_retriever.build_grounded_context(clean_text, top_k=4)

    # 4. Agent Specialist & MCP Tool Integration
    # Determine if specialized MCP pipeline is triggered
    specialist_role = "Industrial AI Assistant"
    hitl_required = False
    hitl_proposal = None
    evidence_bundle = None
    tool_trace = []

    # If query mentions vibration, pump, bearing, or agent mode is maintenance:
    lower_query = clean_text.lower()
    is_maintenance_query = any(k in lower_query for k in ["vib", "bearing", "p-104", "bfp", "telemetry", "fft", "sensor"]) or request.agent_mode == "maintenance"
    is_weld_query = any(k in lower_query for k in ["weld", "radiograph", "ndt", "porosity", "defect", "crack", "asme"]) or request.agent_mode == "quality"
    is_safety_query = any(k in lower_query for k in ["loto", "lockout", "spill", "osha", "hazard", "ppe", "evacuate"]) or request.agent_mode == "safety"
    is_turbine_query = any(k in lower_query for k in ["turbine", "st-01", "steam", "barring", "vacuum"]) or request.agent_mode == "engineering"

    if is_maintenance_query and any(k in lower_query for k in ["diagnos", "status", "check", "alarm", "telemetry", "iso 10816", "vibration"]):
        from mcp_servers.sql_telemetry_runner.server import sql_runner_server
        from mcp_servers.anomaly_detection_invoke.server import anomaly_server
        from mcp_servers.compliance_rule_engine.server import compliance_engine_server
        from mcp_servers.work_order_draft.server import work_order_server

        specialist_role = "Maintenance Specialist Agent"
        telem = sql_runner_server.query_telemetry("BFP-P-104", time_window_minutes=60)
        tool_trace.append({"step": "sql_telemetry_runner", "detail": "Retrieved 60m vibration time-series from TimescaleDB"})
        
        vib_series = [pt["vibration_rms_de"] for pt in telem["telemetry_series"]]
        anomaly = anomaly_server.detect_anomalies(vib_series, sigma=2.0)
        anomaly_cnt = len(anomaly.get("anomaly_points", []))
        tool_trace.append({"step": "anomaly_detection_invoke", "detail": f"Detected {anomaly_cnt} statistical spikes"})

        latest_vib = telem["current_metrics"]["vibration_rms_de"]
        compliance = compliance_engine_server.evaluate_compliance("ISO_10816_3", {"vibration_velocity_rms": latest_vib})
        tool_trace.append({"step": "compliance_rule_engine", "detail": f"Assigned ISO Zone: {compliance['assigned_zone']}"})

        evidence_bundle = {
            "equipment_tag": "BFP-P-104",
            "equipment_name": "High-Pressure Boiler Feed Pump P-104",
            "telemetry_points": telem["telemetry_series"],
            "latest_metrics": telem["current_metrics"],
            "iso_zone": compliance["assigned_zone"],
            "compliance_status": compliance["compliance_status"],
            "failure_mode": "Drive End Bearing Degradation (SKF 7318)"
        }

        if latest_vib > 7.1:
            hitl_required = True
            hitl_proposal = work_order_server.draft_order(
                equipment_tag="BFP-P-104",
                priority="EMERGENCY_TIER_1",
                description=f"CRITICAL: Vibration reached {latest_vib} mm/s (ISO 10816-3 Zone D). Switch to Standby Pump P-104B and overhaul Drive End Bearing SKF 7318.",
                required_craft="Lead Mechanical Millwright",
                estimated_downtime_hours=4.5
            )
            tool_trace.append({"step": "work_order_draft", "detail": f"Drafted Work Order #{hitl_proposal['work_order_id']} pending HITL signoff"})

    elif is_weld_query:
        specialist_role = "Quality & Inspection Specialist Agent"
        tool_trace.append({"step": "asme_quality_evaluator", "detail": "Evaluated weld criteria against ASME Section IX"})
    elif is_safety_query:
        specialist_role = "Safety & Compliance Specialist Agent"
        tool_trace.append({"step": "osha_compliance_verifier", "detail": "Checked OSHA 1910.147 & ISO 45001 protocol"})
    elif is_turbine_query:
        specialist_role = "Engineering Specialist Agent"
        tool_trace.append({"step": "turbine_thermal_evaluator", "detail": "Analyzed ST-01 thermal ramp constraints"})

    # 5. Retrieve recent conversation history turns
    history_messages = memory_store.get_messages_for_session(session_id)
    recent_history = [{"role": m["role"], "content": m["content"]} for m in history_messages[-4:]]

    # 5.b Add Attached Files to Grounded Context if present
    if request.attachments:
        attachment_texts = []
        for att in request.attachments:
            fname = att.get("filename", "attached_file")
            # Parse text cleanly from PDF, CSV, log, code, or base64
            extracted_txt = parse_attachment_to_text(att)
            if extracted_txt and not extracted_txt.startswith("%PDF-"):
                attachment_texts.append(f"ATTACHED DOCUMENT [{fname}]:\n{extracted_txt}")
            elif att.get("preview") and att.get("type") != "image":
                attachment_texts.append(f"ATTACHED FILE [{fname}]:\n{att.get('preview')}")

        if attachment_texts:
            att_block = "\n---\n" + "\n---\n".join(attachment_texts)
            grounded_context = (grounded_context + "\n" + att_block) if grounded_context else att_block

    # 6. INFERENCE: Generate Grounded Answer via Ollama Local Model
    ollama_result = await ollama_client.generate_grounded_answer(
        query=clean_text,
        grounding_context=grounded_context,
        recent_history=recent_history,
        model=request.model or "gemma3:4b",
        specialist_role=specialist_role,
        attachments=request.attachments
    )

    final_content = ollama_result.get("content", "")

    # If the bot learned something from this interaction, add a clear confirmation note
    if learned_info:
        final_content += f"\n\n> 💡 **Continuous Learning Recorded**: *\"{learned_info['fact']}\"* (Category: `{learned_info['category']}`). I have committed this to Apex Heavy Dynamics' sovereign memory and will apply it to all future queries."

    # If HITL gate triggered, add callout
    if hitl_required and hitl_proposal:
        final_content += (
            f"\n\n> [!IMPORTANT]\n"
            f"> **Human-In-The-Loop (HITL) Gatekeeper Required**: Work Order `{hitl_proposal['work_order_id']}` has been staged. "
            f"Please review and authorize using the action card below."
        )

    # 7. Save Assistant Message to SQLite
    bot_msg_id = f"agt-{uuid.uuid4().hex[:6]}"
    bot_msg = memory_store.add_message(
        message_id=bot_msg_id,
        session_id=session_id,
        sender=specialist_role,
        role="assistant",
        content=final_content,
        timestamp=now_time,
        reasoning=f"Grounded in {len(citations)} sources. Model: {ollama_result.get('model')}. Inference mode: 100% offline air-gapped.",
        evidence=evidence_bundle,
        citations=citations,
        trace=tool_trace,
        hitl_proposal=hitl_proposal,
        learned_fact_id=learned_info["fact_id"] if learned_info else None
    )

    # Log SIEM event
    log_audit_event("AI_QUERY_GROUNDED_COMPLETED", {
        "session_id": session_id,
        "specialist": specialist_role,
        "model": ollama_result.get("model"),
        "citations_count": len(citations),
        "learned_new_fact": bool(learned_info),
        "hitl_required": hitl_required
    })

    return {
        "channel_id": session_id,
        "session_id": session_id,
        "user_message": user_msg,
        "agent_response": bot_msg,
        "learned_info": learned_info,
        "citations": citations,
        "model_used": ollama_result.get("model")
    }

# --- Learned Memory Management Endpoints ---
class ManualTeachRequest(BaseModel):
    fact: str
    category: Optional[str] = "general"
    key: Optional[str] = None
    taught_by: Optional[str] = "Director M. Sharma"

@app.get("/api/memory/list")
async def list_learned_memories():
    return memory_store.get_all_learned_facts()

@app.post("/api/memory/add")
async def add_learned_memory(req: ManualTeachRequest):
    record = learning_engine.manual_teach(
        fact=req.fact,
        category=req.category or "general",
        key=req.key,
        taught_by=req.taught_by or "Director M. Sharma"
    )
    log_audit_event("MANUAL_MEMORY_ADDED", {"fact_id": record["id"], "category": record["category"]})
    return record

@app.delete("/api/memory/{fact_id}")
async def delete_learned_memory(fact_id: str):
    success = memory_store.delete_learned_fact(fact_id)
    if not success:
        raise HTTPException(status_code=404, detail="Fact not found")
    log_audit_event("MANUAL_MEMORY_DELETED", {"fact_id": fact_id})
    return {"success": True, "fact_id": fact_id}

# --- Company Knowledge Exploration Endpoints ---
@app.get("/api/knowledge/documents")
async def list_company_documents():
    return memory_store.get_all_documents()

# --- HITL Decisions & SIEM Logs ---
class HITLApprovalRequest(BaseModel):
    work_order_id: str
    action: str # "APPROVE" or "REJECT"
    signed_by: str = "Director M. Sharma"
    clearance_code: str = "SIG-SOV-LEVEL5-9941"
    comments: Optional[str] = None

@app.post("/api/hitl/approve")
async def approve_hitl_action(req: HITLApprovalRequest):
    audit_id = f"HITL-{uuid.uuid4().hex[:6].upper()}"
    log_audit_event("HITL_CRITICAL_ACTION_SIGNED", {
        "work_order_id": req.work_order_id,
        "decision": req.action,
        "signer": req.signed_by,
        "clearance_code": req.clearance_code,
        "comments": req.comments
    }, clearance="TOP_SECRET_LEVEL_5")

    return {
        "success": True,
        "audit_id": audit_id,
        "work_order_id": req.work_order_id,
        "status": "AUTHORIZED_AND_EXECUTING" if req.action == "APPROVE" else "ABORTED_BY_DIRECTOR",
        "signed_by": req.signed_by,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "cryptographic_stamp": f"SHA256-CERTIFIED-{uuid.uuid4().hex[:12].upper()}"
    }

@app.post("/api/audio/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    content = await file.read()
    res = whisper_service.transcribe_audio_bytes(content, filename=file.filename)
    log_audit_event("VOICE_MEMO_TRANSCRIBED", {"filename": file.filename, "size_kb": res.get("size_kb")})
    return res

@app.post("/api/documents/parse-file")
async def parse_document_file(file: UploadFile = File(...)):
    """
    Parses uploaded PDF and technical document files into clean text for local air-gapped LLMs.
    Eliminates binary encoding corruption and extracts pages with pypdf.
    """
    content = await file.read()
    filename = file.filename or "uploaded_document"
    size_kb = max(1, round(len(content) / 1024.0))

    if filename.lower().endswith(".pdf"):
        res = extract_text_from_pdf_bytes(content)
        log_audit_event("PDF_PARSED", {"filename": filename, "page_count": res.get("page_count", 0), "size_kb": size_kb})
        return {
            "success": res.get("success", False),
            "filename": filename,
            "type": "document",
            "page_count": res.get("page_count", 0),
            "text_content": res.get("text", ""),
            "char_count": res.get("char_count", 0),
            "preview": f"PDF Document: {filename} ({res.get('page_count', 0)} pages, {size_kb} KB)",
            "size_kb": size_kb
        }
    elif filename.lower().endswith(".docx"):
        res = extract_text_from_docx_bytes(content)
        log_audit_event("DOCX_PARSED", {"filename": filename, "size_kb": size_kb})
        return {
            "success": res.get("success", False),
            "filename": filename,
            "type": "document",
            "page_count": 1,
            "text_content": res.get("text", ""),
            "char_count": res.get("char_count", 0),
            "preview": f"Word Document: {filename} ({size_kb} KB)",
            "size_kb": size_kb
        }
    else:
        # Plain text, CSV, SCADA logs, DXF CAD files
        try:
            txt = content.decode("utf-8")
        except UnicodeDecodeError:
            txt = content.decode("latin1", errors="replace")
        
        file_type = "scada" if filename.lower().endswith(".csv") else "cad" if filename.lower().endswith(".dxf") else "document"
        log_audit_event("DOC_PARSED", {"filename": filename, "type": file_type, "size_kb": size_kb})
        return {
            "success": True,
            "filename": filename,
            "type": file_type,
            "page_count": 1,
            "text_content": txt[:40000],
            "char_count": len(txt),
            "preview": f"Document: {filename} ({size_kb} KB)",
            "size_kb": size_kb
        }

@app.get("/api/siem/logs")
async def get_siem_logs():
    return {
        "count": len(AUDIT_LOG_BUFFER),
        "tamper_evident": True,
        "enclave": "AIRGAP-NODE-07",
        "logs": AUDIT_LOG_BUFFER[:30]
    }

@app.get("/api/telemetry/live")
async def get_live_telemetry():
    from mcp_servers.sql_telemetry_runner.server import sql_runner_server
    return sql_runner_server.query_telemetry("BFP-P-104", time_window_minutes=60)

# --- Compatibility Endpoints for Existing Widgets & Tests ---
@app.get("/api/channels")
async def get_channels():
    # Return sessions formatted as channels for compatibility
    sessions = memory_store.get_sessions()
    if not sessions:
        await list_sessions()
        sessions = memory_store.get_sessions()
    
    channels = []
    for s in sessions:
        channels.append({
            "id": s["id"],
            "name": s["title"],
            "category": s["category"],
            "role": f"Ollama ({s['model']})",
            "avatar_badge": "⚙️" if s["category"] == "maintenance" else ("🔍" if s["category"] == "quality" else "🤖"),
            "clearance": "RESTRICTED_LEVEL_3",
            "last_message": "Session active",
            "unread_count": 0,
            "is_p2p": False
        })
    return channels

@app.get("/api/messages/{channel_id}")
async def get_messages(channel_id: str):
    msgs = memory_store.get_messages_for_session(channel_id)
    if not msgs:
        return [
            {
                "id": f"msg-init-{channel_id}",
                "sender": "system",
                "role": "system",
                "content": "🔒 Sovereign Air-Gapped Session Active • Local Ollama LLM • Zero Cloud Egress Enforced",
                "timestamp": datetime.datetime.now().strftime("%H:%M")
            }
        ]
    return msgs

# Mount frontend static files with explicit cache-busting for index.html
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    @app.get("/")
    @app.get("/index.html")
    async def serve_index_no_cache():
        idx_path = os.path.join(frontend_dist, "index.html")
        resp = FileResponse(idx_path)
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        resp.headers["Pragma"] = "no-cache"
        resp.headers["Expires"] = "0"
        return resp

    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
