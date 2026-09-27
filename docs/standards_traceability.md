# Standards Traceability Matrix
## Compliance with Global Industrial & Security Frameworks
**Project: Sovereign On-Premise Agentic AI Workbench (SIH26117)**

| Standard / Framework | Requirement Clause | Technical Implementation in Workbench | Verification Mechanism |
| :--- | :--- | :--- | :--- |
| **IEC 62443-4-2** (IACS Cybersecurity) | CR 1.1: Human User Identification & Authentication | Keycloak RBAC integration with role-based JWT tokens and clearance tiers. | Role validation middleware on every API endpoint. |
| **IEC 62443-3-3** (System Security Requirements) | SR 5.2: Zone Boundary Protection & Egress Denial | Strict host firewall rules (`firewall-egress-deny.rules`) blocking outbound public Internet calls. | Automated network egress scanning and port bind audits. |
| **NIST SP 800-53 Rev. 5** | AC-3: Access Enforcement & Least Privilege | Open Policy Agent (OPA) policy rules restricting MCP tool execution per agent role. | Unit tests in `tests/unit/test_guardrails.py`. |
| **NIST SP 800-53 Rev. 5** | AU-2 / AU-3: Event Logging & Audit Generation | Wazuh SIEM local audit logger with HMAC-SHA256 tamper-evident chaining. | Integrity checksum verification script. |
| **ISO 27001:2022** | A.8.24: Use of Cryptography | End-to-end symmetric/asymmetric session encryption for executive comms channels. | Cryptographic signature verification modal in UI. |
| **ISO 45001** (Occupational Health & Safety) | Clause 8.1.2: Eliminating Hazards & Reducing Risks | Automated Safety Agent validating sensor readings against OSHA/ISO hazard threshold tables. | Safety Agent test cases and risk matrix output check. |
| **OWASP LLM01:2025** | Prompt Injection Prevention | Multi-layer heuristic and semantic guardrail (`gateway/guardrails/prompt_injection_filter.py`). | Redteam attack test suite in `tests/redteam/`. |
| **OWASP LLM02:2025** | Sensitive Information Disclosure | Regex + NER PII scrubber masking equipment serials, passwords, and private identifiers. | Input/output sanitization unit tests. |
| **OWASP LLM06:2025** | Excessive Agency Prevention | Human-in-the-Loop (HITL) Gatekeeper requiring cryptographic signoff for critical plant actions. | Automated HITL gate interception verification. |
| **ISO 10816-3** | Mechanical Vibration Severity Standards | Maintenance Agent FFT vibration spectral analysis classifying vibration velocity (mm/s). | SCADA sample telemetry evaluation test. |
