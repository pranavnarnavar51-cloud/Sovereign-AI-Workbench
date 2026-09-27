"""
Qdrant Vector Database Schema & Collection Definitions
Strictly local vector store for air-gapped industrial RAG.
"""
from typing import Dict, Any

COLLECTIONS_CONFIG: Dict[str, Any] = {
    "industrial_sop_corpus": {
        "vector_size": 1024,
        "distance": "Cosine",
        "hnsw_config": {
            "m": 16,
            "ef_construct": 100,
            "full_scan_threshold": 1000
        },
        "payload_schema": {
            "equipment_id": "keyword",
            "section_type": "keyword",
            "iso_standard": "keyword",
            "severity_level": "keyword",
            "page_number": "integer",
            "text": "text"
        }
    },
    "visual_inspection_embeddings": {
        "vector_size": 768,
        "distance": "Cosine",
        "hnsw_config": {
            "m": 16,
            "ef_construct": 64
        },
        "payload_schema": {
            "defect_type": "keyword",
            "component_id": "keyword",
            "iso_5817_class": "keyword",
            "confidence": "float"
        }
    }
}
