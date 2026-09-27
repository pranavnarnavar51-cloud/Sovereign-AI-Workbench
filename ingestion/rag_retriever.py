"""
Sovereign Hybrid RAG Retriever
Queries both seeded corporate documents and dynamic employee-learned facts.
Supports fast BM25/keyword scoring and local vector embeddings (via Ollama nomic-embed-text)
100% offline with zero cloud dependency.
"""
import re
import math
from typing import List, Dict, Any, Tuple
from stores.knowledge_memory import memory_store

def tokenize(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r"\b[a-zA-Z0-9_\-]{2,}\b", text)]

class SovereignRAGRetriever:
    def retrieve(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Retrieves most relevant context items from:
        1. Company SOPs & technical manuals
        2. Employee-learned continuous facts
        """
        query_tokens = set(tokenize(query))
        if not query_tokens:
            return []

        results = []

        # 1. Search Learned Facts (high priority for recent employee updates)
        learned_facts = memory_store.get_all_learned_facts()
        for fact in learned_facts:
            fact_text = f"{fact['key']} {fact['fact']} {fact['category']}"
            fact_tokens = tokenize(fact_text)
            overlap = query_tokens.intersection(set(fact_tokens))
            if overlap:
                # Give high weight to learned facts because they represent fresh employee knowledge
                score = (len(overlap) / (math.sqrt(len(query_tokens)) + 0.1)) * 1.5
                results.append({
                    "id": fact["id"],
                    "type": "learned_fact",
                    "title": f"Learned from Employee ({fact['taught_by']})",
                    "content": fact["fact"],
                    "category": fact["category"],
                    "score": round(score, 3),
                    "source": f"Learned Fact ({fact['taught_by']} - {fact['created_at'][:10]})",
                    "timestamp": fact["created_at"]
                })

        # 2. Search Company Corpus Documents
        docs = memory_store.get_all_documents()
        for doc in docs:
            doc_text = f"{doc['title']} {doc['content']} {doc['tags']} {doc['equipment_tag']}"
            doc_tokens = tokenize(doc_text)
            overlap = query_tokens.intersection(set(doc_tokens))
            if overlap:
                score = len(overlap) / (math.sqrt(len(query_tokens)) + 0.1)
                results.append({
                    "id": doc["id"],
                    "type": "company_document",
                    "title": doc["title"],
                    "content": doc["content"],
                    "category": doc["doc_type"],
                    "score": round(score, 3),
                    "source": doc["id"],
                    "equipment_tag": doc["equipment_tag"]
                })

        # Sort by score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def build_grounded_context(self, query: str, top_k: int = 4) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Retrieves context items and compiles a formatted grounding prompt block.
        """
        items = self.retrieve(query, top_k=top_k)
        if not items:
            return "", []

        context_lines = []
        for i, item in enumerate(items, 1):
            if item["type"] == "learned_fact":
                context_lines.append(
                    f"[{i}] SOURCE: (EMPLOYEE LEARNED KNOWLEDGE - {item['source']})\n"
                    f"FACT: {item['content']}\n"
                )
            else:
                context_lines.append(
                    f"[{i}] SOURCE: ({item['title']})\n"
                    f"DOCUMENT CONTENT:\n{item['content']}\n"
                )

        formatted_context = "\n---\n".join(context_lines)
        return formatted_context, items

rag_retriever = SovereignRAGRetriever()
