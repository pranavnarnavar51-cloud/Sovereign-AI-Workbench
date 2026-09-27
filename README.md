# Sovereign On-Premise Agentic AI Workbench (SIH26117)
### Open-Weight Multimodal LLMs & Continuous Learning for Confidential Industrial Work
**Team InfinityCoders | Smart India Hackathon 2026**

---

## 🛡️ Executive Overview & Problem Statement
In heavy industrial infrastructure (Power Generation, Petrochemicals, Steel Manufacturing, Aerospace, and Defense Facilities), operational data is critically confidential and mission-critical. Traditional cloud-hosted AI introduces severe espionage risks, data sovereignty violations, and external attack surfaces.

The **Sovereign On-Premise Agentic AI Workbench** is a **100% air-gapped, zero-cloud-dependent multi-agent operational platform**. It enables plant executives, operations planners, reliability engineers, and shopfloor operators to:
1. **Run 100% Offline with Ollama**: Powered by open-weight models (`llama3.2:latest`, `llava:latest`, `nomic-embed-text:latest`) without any internet connection or cloud telemetry.
2. **Access Pre-Seeded Industrial Knowledge**: Rich standard operating procedures, manuals, safety protocols, and plant directories for *Apex Heavy Dynamics Corp*.
3. **Continuously Learn from Employees**: Every conversation is saved persistently into local SQLite memory. When an employee teaches new facts, rules, or procedural updates (e.g. *"Remember that Turbine 4 pressure threshold is 320 PSI"* or *"The supervisor for Shift B is Mr. Rajesh Patel"*), the AI automatically extracts the knowledge and incorporates it into all future answers.
4. **ChatGPT-Style Dashboard**: Modern, clean, responsive ChatGPT interface with collapsible sidebar, session history, prompt starter suggestions, floating pill input bar, grounding citations drawer, and a dedicated Brain Memory Inspector.

---

## 🏛️ 5-Layer Sovereign Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 5 - Sovereign Workbench UI (ChatGPT-Style Executive Dashboard)       │
│  • Collapsible Session History       • Model Selector (llama3.2 / llava)    │
│  • Grounding Citations Drawer        • Brain Memory (Learned Facts) Inspector│
│  • In-Chat HITL Approval Cards       • Multimodal Attachment (LLaVA / CAD)  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Layer 4 - Security Gateway & Access Control                                │
│  • OWASP LLM Top 10 Guardrails       • Regex + Semantic PII/Secrets Scrubber│
│  • Prompt Injection Filter           • OPA (Open Policy Agent) RBAC         │
│  • Tamper-Evident Wazuh SIEM Logs    • Zero Egress Firewalled Node          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Layer 3 - Continuous Learning & Knowledge Data Stores                      │
│  • Persistent SQLite Store           • Hybrid BM25 & Semantic RAG Retriever │
│  • Pre-seeded Company SOP Corpus     • Dynamic Employee Fact Extractor      │
│  • SCADA Telemetry TimescaleDB Store • SHA-256 Ingestion Audit Integrity    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Layer 2 - Sovereign Local Inference Engine                                 │
│  • Ollama Daemon (llama3.2, llava)   • Grounded Prompt Context Injection    │
│  • Whisper Voice Memo Transcriber    • nomic-embed-text Local Embeddings    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Layer 1 - Local Physical Infrastructure & Network Isolation                │
│  • Air-Gapped Compute Node           • Egress Deny Firewall Rules           │
│  • Isolated Docker / K8s vSwitches   • 7x Industrial MCP Tool Sandboxes     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Continuous Learning & Episodic Memory

The system features an autonomous continuous learning engine that watches for employee instructions, corrections, and factual updates during normal conversation:

| Employee Teaches | AI Processing | Future Inquiries |
| :--- | :--- | :--- |
| *"The new supervisor for Shift B is Mr. Rajesh Patel ext 4402."* | Evaluates teaching intent, extracts key entity, saves to `stores/sovereign_memory.db` under `personnel`. | *"Who is the supervisor for Shift B?"* -> Responds with *Mr. Rajesh Patel (Ext 4402)* citing employee knowledge. |
| *"Remember that the emergency radio channel is Channel 7."* | Extracts safety directive, commits to long-term memory. | *"What is our emergency radio channel?"* -> Immediate recall of *Channel 7*. |
| *"Correction: Turbine 4 pressure threshold is now 320 PSI."* | Updates equipment parameter, stores with high confidence. | Diagnoses and alerts according to the new 320 PSI limit. |

### Brain Memory Inspector
Employees and executives can open the **Brain & Evidence Drawer** to:
- Review every fact learned by the AI with timestamp and author attribution.
- Filter by category (`personnel`, `procedure`, `equipment`, `safety`, `policy`).
- Explicitly add new company directives with the "+ Teach AI Fact" button.
- Remove or correct outdated facts with single-click deletion.

---

## 📚 Seeded Company Documentation (*Apex Heavy Dynamics Corp*)
- **`SOP-MNT-101`**: Boiler Feed Pump BFP-P-104 inspection, bearing specs (SKF 7318), and ISO 10816-3 vibration limits (Zone D trip at 7.10 mm/s).
- **`SOP-SAF-204`**: Mandatory 6-step Lockout/Tagout (LOTO) & zero energy state verification under OSHA 1910.147.
- **`SOP-ENV-301`**: Chemical and coolant spill containment, PPE requirements, and hazardous waste disposal protocol.
- **`SOP-ENG-402`**: 25 MW Steam Turbine ST-01 cold startup, barring gear speed (120 RPM), and maximum warming rate (5°C/min).
- **`SOP-QAL-503`**: Radiographic and ultrasonic weld defect inspection acceptance criteria under ASME Section IX.
- **`DIR-EMP-001`**: Facility 07 executive directory, shift schedule (Shifts A, B, C), and emergency response hotlines.

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js v18+ & npm
- Local Ollama running with installed models:
  ```bash
  ollama list
  # Required models:
  # llama3.2:latest (or llama3.2)
  # llava:latest (optional for vision)
  # nomic-embed-text:latest (optional for embeddings)
  ```

### 1. Install Dependencies
```bash
cd SovereignAgenticWorkbench
pip install -r requirements.txt
cd frontend
npm install
npm run build
cd ..
```

### 2. Run All Automated Tests
```bash
python -m pytest tests -v
```
*(Runs all 19 unit, integration, red-team prompt injection, and continuous learning tests).*

### 3. Launch the Sovereign Workbench
Run the unified FastAPI server:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Open **`http://localhost:8000`** in your browser to access the complete ChatGPT-style Sovereign AI Workbench!

*(Alternatively, run the Vite development server with hot-reload via `cd frontend && npm run dev` at `http://localhost:5173`).*

---

## 📜 Regulatory Standards Traceability
- **IEC 62443**: Security for Industrial Automation and Control Systems (Zone & Conduit separation).
- **ISO 27001**: Information Security Management & cryptographic access controls.
- **ISO 10816-3**: Mechanical vibration evaluation for industrial machinery.
- **OSHA 29 CFR 1910.147**: The control of hazardous energy (Lockout/Tagout).
- **ASME Boiler & Pressure Vessel Code Section IX**: Welding and Brazing Qualifications.
- **OWASP Top 10 for LLMs (2025)**: Active mitigation for LLM01 (Prompt Injection), LLM02 (Sensitive Information Disclosure), and LLM06 (Excessive Agency).
