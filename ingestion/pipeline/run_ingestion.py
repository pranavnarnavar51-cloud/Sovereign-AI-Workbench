"""
Master Ingestion Pipeline Runner
Processes manuals, CAD drawings, inspection datasets, and SCADA logs into local stores.
"""
import os
import sys
import logging

from ingestion.pipeline.parsers.docling_pdf_parser import docling_parser
from ingestion.pipeline.chunking.semantic_chunker import semantic_chunker
from ingestion.pipeline.indexing.vector_indexer import vector_indexer
from ingestion.pipeline.validation.checksum_and_audit_log import audit_validator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sovereign.ingestion")

def run():
    logger.info("Initializing Sovereign Air-Gapped Ingestion Pipeline...")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    manual_path = os.path.join(base_dir, "sample_corpus", "manuals", "boiler_feed_pump_p104.txt")

    if os.path.exists(manual_path):
        logger.info(f"Parsing manual: {manual_path}")
        sections = docling_parser.parse_document(manual_path)
        total_chunks = 0
        for sec in sections:
            chunks = semantic_chunker.chunk_document(sec["text"], {"title": sec["title"], "equipment": "BFP-P-104"})
            vector_indexer.index_chunks(chunks)
            total_chunks += len(chunks)
        
        manifest = audit_validator.record_ingestion_manifest(manual_path, total_chunks)
        logger.info(f"Ingestion complete. Total chunks: {total_chunks}. SHA256: {manifest['sha256'][:16]}...")
        return total_chunks
    else:
        logger.warning(f"Manual not found at {manual_path}")
        return 0

if __name__ == "__main__":
    run()
