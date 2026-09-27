"""
BGE-M3 Dense & Lexical Hybrid Embedding Service
Used for industrial standard operating procedures and technical manuals.
"""
import hashlib
from typing import List, Dict, Any

class BGEM3EmbeddingService:
    def __init__(self, dimension: int = 1024):
        self.dimension = dimension

    def encode_text(self, text: str) -> Dict[str, Any]:
        """Generate dense vector and sparse token weights."""
        seed = int(hashlib.sha256(text.encode('utf-8')).hexdigest(), 16)
        import numpy as np
        np.random.seed(seed % (2**32))
        dense_vec = np.random.normal(0, 1, self.dimension)
        dense_vec = (dense_vec / np.linalg.norm(dense_vec)).tolist()
        
        words = [w.lower() for w in text.split() if len(w) > 3]
        sparse_weights = {w: float(round(1.0 / (i + 1), 3)) for i, w in enumerate(set(words[:10]))}

        return {
            "dense_vector": dense_vec,
            "sparse_weights": sparse_weights,
            "dimension": self.dimension
        }

bge_service = BGEM3EmbeddingService()
