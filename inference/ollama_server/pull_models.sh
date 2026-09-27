#!/usr/bin/env bash
# Air-Gapped Model Staging Script
# Run once during secure facility provisioning before cutting external network conduit

echo "=== Staging Open-Weight Foundation Models for Sovereign Workbench ==="

echo "1. Pulling primary text model (llama3.2)..."
ollama pull llama3.2

echo "2. Pulling multimodal vision model (llava)..."
ollama pull llava

echo "3. Pulling embedding model (nomic-embed-text)..."
ollama pull nomic-embed-text

echo "=== Model Pre-seeding Complete. Air-gap ready. ==="
