# MVP vs. Production Architecture Matrix
**Project: Sovereign On-Premise Agentic AI Workbench (SIH26117)**

This document delineates the operational features in the standalone MVP demonstration versus full multi-rack industrial production deployment.

| Feature Area | MVP / Prototype Implementation | Full Enterprise Production Deployment |
| :--- | :--- | :--- |
| **Inference Engine** | Local Ollama running quantized `llama3.2` & `llava` on host GPU/CPU | Distributed vLLM / Ollama cluster with TensorRT-LLM on dual NVIDIA H100/A100 nodes |
| **Multimodal Vision** | LLaVA / Qwen2.5-VL with local bounding box and defect classification simulation | Fine-tuned industrial defect models + FLIR thermal camera RTSP stream ingester |
| **Vector Search** | In-memory / Docker Qdrant with local dense embedding vectors | High-availability clustered Qdrant with BGE-M3 hybrid sparse-dense indexes |
| **Knowledge Graph** | Neo4j Community / embedded Cypher ontology of primary plant equipment & failures | Enterprise Neo4j Aura on-prem cluster integrated directly with SAP PM / Maximo ERP |
| **Time-Series Telemetry** | TimescaleDB with live synthetic vibration FFT generator and historical CSV replay | Kafka / OPC-UA / MQTT industrial bridge streaming 50,000 tags/sec from Emerson/Honeywell DCS |
| **Access Control** | Embedded RBAC with simulated Keycloak/JWT tokens and clearance levels | Enterprise Keycloak / Active Directory / Smart Card (CAC/PIV) PKI integration |
| **Network Security** | Windows / Linux local loopback air-gap rules with zero external egress enforcement | Physical fiber optic data diodes (hardware unidirectional flow) and air-gapped VLANs |
| **User Interface** | Single-page WhatsApp-style executive app with split-screen Evidence & Trace panels | Distributed multi-monitor control room dashboard with field tablet support |
