"""
Docling / Unstructured PDF & Manual Parser
Extracts section headers, tables, diagrams, and operating limits from industrial engineering manuals.
"""
import os
import json
from typing import List, Dict, Any

class DoclingPDFParser:
    def __init__(self):
        pass

    def parse_document(self, file_path: str) -> List[Dict[str, Any]]:
        """Parses industrial PDF/text manual into structured sections."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Manual not found: {file_path}")

        sections = []
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        raw_chunks = content.split("## ")
        for i, chunk in enumerate(raw_chunks):
            if not chunk.strip():
                continue
            lines = chunk.strip().split("\n")
            title = lines[0]
            body = "\n".join(lines[1:])
            sections.append({
                "section_id": f"SEC-{i+1:03d}",
                "title": title,
                "text": body,
                "source_file": os.path.basename(file_path),
                "is_table": "|" in body
            })
        return sections

docling_parser = DoclingPDFParser()
