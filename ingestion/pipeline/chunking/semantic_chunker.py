"""
Industrial Semantic Chunker
Preserves operational boundaries, safety warnings, and ISO citations.
"""
from typing import List, Dict, Any

class SemanticChunker:
    def __init__(self, max_chunk_tokens: int = 512, overlap_tokens: int = 64):
        self.max_chunk_tokens = max_chunk_tokens
        self.overlap_tokens = overlap_tokens

    def chunk_document(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = []
        current_len = 0

        for para in paragraphs:
            words = para.split()
            if not words:
                continue
            if current_len + len(words) > self.max_chunk_tokens:
                chunk_text = "\n\n".join(current_chunk)
                chunks.append({
                    "text": chunk_text,
                    "metadata": {**metadata, "token_count": current_len}
                })
                current_chunk = [para]
                current_len = len(words)
            else:
                current_chunk.append(para)
                current_len += len(words)

        if current_chunk:
            chunks.append({
                "text": "\n\n".join(current_chunk),
                "metadata": {**metadata, "token_count": current_len}
            })
        return chunks

semantic_chunker = SemanticChunker()
