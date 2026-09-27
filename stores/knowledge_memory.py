"""
Sovereign On-Premise Knowledge & Continuous Memory Store (SQLite)
Air-gapped persistent storage for:
1. Company standard operating procedures, manuals, and directories.
2. Continuous employee-taught facts & episodic/semantic memory.
3. ChatGPT-style chat sessions and complete message conversation histories.
"""
import os
import json
import sqlite3
import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sovereign_memory.db")

class SovereignMemoryStore:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Create tables if they don't exist."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Company Corpus (Pre-seeded industrial documentation)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS company_documents (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    doc_type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    equipment_tag TEXT,
                    tags TEXT,
                    last_updated TEXT
                )
            """)

            # 2. Continuous Learned Facts (Learned from employees)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS learned_facts (
                    id TEXT PRIMARY KEY,
                    key TEXT NOT NULL,
                    fact TEXT NOT NULL,
                    category TEXT NOT NULL,
                    taught_by TEXT NOT NULL,
                    confidence REAL DEFAULT 1.0,
                    created_at TEXT NOT NULL,
                    verified INTEGER DEFAULT 1,
                    source_session_id TEXT
                )
            """)

            # 3. Chat Sessions (ChatGPT-style history threads)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    model TEXT NOT NULL,
                    category TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)

            # 4. Chat Messages (Full persistent history)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    sender TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    reasoning TEXT,
                    evidence_json TEXT,
                    citations_json TEXT,
                    trace_json TEXT,
                    hitl_json TEXT,
                    learned_fact_id TEXT,
                    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
                )
            """)

            conn.commit()

    # --- Company Documents CRUD ---
    def insert_or_update_doc(self, doc_id: str, title: str, doc_type: str, content: str, equipment_tag: str = "", tags: str = ""):
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO company_documents (id, title, doc_type, content, equipment_tag, tags, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title=excluded.title,
                    doc_type=excluded.doc_type,
                    content=excluded.content,
                    equipment_tag=excluded.equipment_tag,
                    tags=excluded.tags,
                    last_updated=excluded.last_updated
            """, (doc_id, title, doc_type, content, equipment_tag, tags, now))
            conn.commit()

    def get_all_documents(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM company_documents ORDER BY title ASC")
            return [dict(row) for row in cursor.fetchall()]

    # --- Learned Facts CRUD (Continuous Learning) ---
    def add_learned_fact(
        self,
        fact_id: str,
        key: str,
        fact: str,
        category: str = "general",
        taught_by: str = "Employee",
        confidence: float = 1.0,
        source_session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO learned_facts (id, key, fact, category, taught_by, confidence, created_at, verified, source_session_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
                ON CONFLICT(id) DO UPDATE SET
                    fact=excluded.fact,
                    category=excluded.category,
                    taught_by=excluded.taught_by,
                    confidence=excluded.confidence,
                    created_at=excluded.created_at
            """, (fact_id, key, fact, category, taught_by, confidence, now, source_session_id))
            conn.commit()
        return {
            "id": fact_id,
            "key": key,
            "fact": fact,
            "category": category,
            "taught_by": taught_by,
            "confidence": confidence,
            "created_at": now
        }

    def get_all_learned_facts(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM learned_facts ORDER BY created_at DESC")
            return [dict(row) for row in cursor.fetchall()]

    def delete_learned_fact(self, fact_id: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM learned_facts WHERE id = ?", (fact_id,))
            conn.commit()
            return cursor.rowcount > 0

    # --- Sessions CRUD (ChatGPT Style) ---
    def create_session(self, session_id: str, title: str = "New Industrial Chat", model: str = "llama3.2:latest", category: str = "general") -> Dict[str, Any]:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO chat_sessions (id, title, model, category, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (session_id, title, model, category, now, now))
            conn.commit()
        return {
            "id": session_id,
            "title": title,
            "model": model,
            "category": category,
            "created_at": now,
            "updated_at": now
        }

    def get_sessions(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM chat_sessions ORDER BY updated_at DESC")
            return [dict(row) for row in cursor.fetchall()]

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM chat_sessions WHERE id = ?", (session_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_session_title(self, session_id: str, new_title: str):
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?", (new_title, now, session_id))
            conn.commit()

    def delete_session(self, session_id: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
            cursor.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
            conn.commit()
            return cursor.rowcount > 0

    # --- Messages CRUD ---
    def add_message(
        self,
        message_id: str,
        session_id: str,
        sender: str,
        role: str,
        content: str,
        timestamp: Optional[str] = None,
        reasoning: Optional[str] = None,
        evidence: Optional[Dict[str, Any]] = None,
        citations: Optional[List[Dict[str, Any]]] = None,
        trace: Optional[List[Dict[str, Any]]] = None,
        hitl_proposal: Optional[Dict[str, Any]] = None,
        learned_fact_id: Optional[str] = None
    ) -> Dict[str, Any]:
        ts = timestamp or datetime.datetime.now().strftime("%H:%M")
        evidence_json = json.dumps(evidence) if evidence else None
        citations_json = json.dumps(citations) if citations else None
        trace_json = json.dumps(trace) if trace else None
        hitl_json = json.dumps(hitl_proposal) if hitl_proposal else None

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO chat_messages (
                    id, session_id, sender, role, content, timestamp,
                    reasoning, evidence_json, citations_json, trace_json, hitl_json, learned_fact_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                message_id, session_id, sender, role, content, ts,
                reasoning, evidence_json, citations_json, trace_json, hitl_json, learned_fact_id
            ))
            
            # Touch session updated_at
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            cursor.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", (now_iso, session_id))
            conn.commit()

        return {
            "id": message_id,
            "session_id": session_id,
            "sender": sender,
            "role": role,
            "content": content,
            "timestamp": ts,
            "reasoning": reasoning,
            "evidence": evidence,
            "citations": citations,
            "trace": trace,
            "hitl_proposal": hitl_proposal,
            "learned_fact_id": learned_fact_id
        }

    def get_messages_for_session(self, session_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM chat_messages WHERE session_id = ? ORDER BY rowid ASC", (session_id,))
            rows = cursor.fetchall()
            messages = []
            for r in rows:
                item = dict(r)
                messages.append({
                    "id": item["id"],
                    "session_id": item["session_id"],
                    "sender": item["sender"],
                    "role": item["role"],
                    "content": item["content"],
                    "timestamp": item["timestamp"],
                    "reasoning": item["reasoning"],
                    "evidence": json.loads(item["evidence_json"]) if item["evidence_json"] else None,
                    "citations": json.loads(item["citations_json"]) if item["citations_json"] else None,
                    "trace": json.loads(item["trace_json"]) if item["trace_json"] else None,
                    "hitl_proposal": json.loads(item["hitl_json"]) if item["hitl_json"] else None,
                    "learned_fact_id": item["learned_fact_id"]
                })
            return messages

# Global singleton
memory_store = SovereignMemoryStore()
