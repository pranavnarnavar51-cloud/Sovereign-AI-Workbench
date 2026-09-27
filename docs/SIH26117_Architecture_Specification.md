# SIH26117 Architecture Specification
## Sovereign On-Premise Agentic AI Workbench for Confidential Industrial Work
**Smart India Hackathon 2026 | Team InfinityCoders**

---

## 1. Executive Summary & Mission
Critical industrial facilities—such as thermal & nuclear power plants, chemical refineries, metallurgical smelters, and heavy engineering production lines—operate under strict secrecy, national security, and critical infrastructure regulations. Operating logs, sensor telemetry, radiographic inspection imagery, and executive decisions cannot be transmitted to public cloud LLM APIs without violating industrial espionage statutes, sovereign data laws, and IEC 62443 cyber standards.

This system provides a **100% On-Premise, Air-Gapped Multi-Agent AI Workbench** utilizing open-weight multimodal foundation models (Llama 3.2/3.3, LLaVA, Qwen2.5-VL, Whisper) served entirely through local hardware.

---

## 2. Five-Layer Architectural Decomposition

### Layer 1: Infrastructure & Network Isolation
- **Air-Gapped Node Configuration**: Physical separation or strict egress-deny firewall filtering.
- **Hardware Acceleration**: Local NVIDIA GPU compute cluster running quantized GGUF/AWQ/EXL2 foundation models.
- **Microservices & Isolation**: Pod-level network policies enforcing zero public route access, isolated Docker networks, and restricted ephemeral sandboxes for tool code execution.

### Layer 2: Local Inference Engine
- **Ollama Engine Daemon**: Optimized local runtime for Llama-3.2 (3B/8B/70B) and LLaVA (multimodal vision inference).
- **Whisper Service**: Local CTranslate2-based Whisper model for confidential voice-to-text notes from field engineers and plant managers.
- **Local Embedding Microservices**: BGE-M3 (dense + sparse lexical hybrid embedding) and CLIP/SigLIP for multimodal image-text vector representation.

### Layer 3: Multimodal Ingestion Pipeline & Stores
- **Docling / Unstructured Parser**: Native extraction of industrial manuals, piping & instrumentation diagrams (P&ID), and ISO standards with table reconstruction.
- **Qdrant Vector Database**: Air-gapped vector store with HNSW indexing and metadata filtering for standard operating procedures (SOPs).
- **Neo4j Knowledge Graph**: Ontological representation of plant hierarchy (Enterprise -> Plant -> Unit -> System -> Equipment -> Sensor) and failure modes (FMEA/FMECA).
- **TimescaleDB**: PostgreSQL time-series extension capturing vibration FFT, temperature, pressure, and flow rates with microsecond timestamps.

### Layer 4: Security Gateway, Guardrails & SIEM
- **LiteLLM On-Prem Proxy**: Unified API translation layer and local token bucket rate limiting.
- **OWASP LLM Top 10 Guardrails**:
  - *LLM01 Prompt Injection*: Active semantic and heuristic token filtering preventing jailbreaks.
  - *LLM02 Sensitive Information Disclosure*: Real-time scrubbing of proprietary equipment serials, API tokens, and confidential personnel records.
  - *LLM06 Excessive Agency*: Human-In-The-Loop (HITL) mandatory approval gates for physical valve commands, setpoint adjustments, or work order creation.
- **Wazuh SIEM Local Audit Logger**: Cryptographically hashed (HMAC-SHA256) tamper-evident audit trail capturing every interaction, prompt, tool execution, and human approval.

### Layer 5: Sovereign Workbench UI (WhatsApp-Style Executive Interface)
- **High-Velocity Executive Design**: Modeled after familiar, clean WhatsApp Web messaging mechanics, optimized for high-pressure plant control rooms and executive boardrooms.
- **Confidential Air-Gapped Channels**: Private peer-to-peer executive rooms between Plant Directors, Chief Engineers, and Security Officers.
- **Specialist Agent Workspaces**: Dedicated chat streams with Maintenance, Quality, Safety, and Engineering AI agents.
- **In-Chat HITL Action Cards**: Authorize physical plant operations and work orders directly within the chat bubble with cryptographic signatures.
- **Dual-Panel Diagnostic Split-Screen**:
  - *Multimodal Evidence Panel*: Heatmaps of defect radiographs, CAD schematics, and live SCADA sparklines.
  - *Trace & Verification Visualizer*: Live DAG visualizer of LangGraph steps, guardrail verdicts, tool calls, and grounded citation verification.

---

## 3. Human-In-The-Loop (HITL) Gatekeeper Workflow
To ensure that autonomous agents do not cause physical harm or operational downtime:
1. **Detection**: An agent recommends an action exceeding risk threshold (e.g. `severity == CRITICAL`).
2. **Interception**: The Verification Engine flags the action as requiring Executive Approval.
3. **Card Rendering**: An interactive HITL card appears in the chat stream with full context, evidence references, and estimated blast radius.
4. **Signoff**: The authorized user reviews and signs off using their security clearance credentials.
5. **Execution & Audit**: The MCP tool server executes the signed command, and an immutable log entry is committed to the local SIEM.
