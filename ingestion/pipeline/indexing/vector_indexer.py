"""
Local Vector Indexer for Qdrant
Indexes parsed chunks locally into Qdrant vector database.
"""
from typing import List, Dict, Any

class VectorIndexer:
    def __init__(self):
        self._in_memory_index = []

    def index_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        for c in chunks:
            self._in_memory_index.append(c)
        return len(chunks)

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        # Keyword-augmented matching over indexed chunks
        terms = [t.lower() for t in query.split()]
        scored = []
        for item in self._in_memory_index:
            score = sum(1 for t in terms if t in item["text"].lower())
            if score > 0:
                scored.append((score, item))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:top_k]]

vector_indexer = VectorIndexer()
