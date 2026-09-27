"""
Continuous Learning Engine for Sovereign On-Premise Industrial AI
Analyzes employee communications to extract new facts, procedural updates,
equipment setting changes, and organizational directives.
Persists them to SQLite long-term memory so subsequent queries reflect what was taught.
"""
import re
import uuid
import datetime
from typing import Dict, Any, Optional, Tuple, List
from stores.knowledge_memory import memory_store

TEACH_PATTERNS = [
    # "Remember that ..."
    r"(?:please\s+)?remember\s+(?:that\s+)?(.+)",
    # "Note that ..." / "Please note: ..."
    r"(?:please\s+)?note\s+(?:that\s+|:\s+)?(.+)",
    # "From now on, ..." / "Starting tomorrow, ..." / "Effective immediately, ..."
    r"(?:from now on|starting (?:today|tomorrow|next week)|effective immediately)[,\s]+(.+)",
    # "Correction: ..." / "Actually, ..."
    r"(?:correction\s*:\s*|actually\s*,\s*)(.+)",
    # "The new [x] is [y]"
    r"(?:the\s+)?new\s+([a-zA-Z0-9_\-\s]+?)\s+is\s+(.+)",
    # "Update: ..." / "Rule update: ..."
    r"(?:rule\s+)?update\s*:\s*(.+)",
    # "We have changed [x] to [y]" / "Our [x] has been changed to [y]"
    r"(?:we have changed|our\s+([a-zA-Z0-9_\-\s]+?)\s+has been changed to)\s+(.+)",
    # "Teach: ..."
    r"teach\s*:\s*(.+)"
]

def extract_teaching_intent(text: str) -> Optional[Tuple[str, str, str]]:
    """
    Evaluates if user input contains teaching, instructions, or factual updates.
    Returns (key, fact_content, category) if detected, else None.
    """
    clean = text.strip()
    
    # 1. Pattern matching for natural language teaching
    matched_fact = None
    for pat in TEACH_PATTERNS:
        m = re.search(pat, clean, re.IGNORECASE)
        if m:
            matched_fact = m.group(1).strip() if len(m.groups()) == 1 else f"{m.group(1).strip()} is {m.group(2).strip()}"
            break

    if not matched_fact:
        # Check explicit keywords
        if any(prefix in clean.lower() for prefix in ["i am teaching you", "store this in memory", "keep in mind that", "our new policy is", "our new supervisor is"]):
            matched_fact = clean
        else:
            return None

    # Categorization heuristic
    category = "general"
    lower_fact = matched_fact.lower()
    if any(k in lower_fact for k in ["supervisor", "manager", "director", "engineer", "contact", "phone", "ext", "personnel", "team", "mr.", "ms.", "mrs."]):
        category = "personnel"
    elif any(k in lower_fact for k in ["vibration", "psi", "temp", "rpm", "bearing", "pump", "turbine", "valve", "sensor", "boiler", "bar"]):
        category = "equipment"
    elif any(k in lower_fact for k in ["sop", "procedure", "checklist", "startup", "shutdown", "loto", "protocol", "step"]):
        category = "procedure"
    elif any(k in lower_fact for k in ["safety", "hazard", "ppe", "osha", "fire", "spill", "chemical"]):
        category = "safety"
    elif any(k in lower_fact for k in ["policy", "shift", "roster", "badge", "leave", "timing"]):
        category = "policy"

    # Derive a key from words
    words = re.findall(r"\b[a-zA-Z0-9_\-]+\b", matched_fact)
    key_words = [w.lower() for w in words if w.lower() not in ["the", "is", "a", "an", "that", "please", "to", "in", "for", "on", "and", "of"]]
    key = "_".join(key_words[:4]) if key_words else f"fact_{uuid.uuid4().hex[:6]}"

    return key, matched_fact, category


class ContinuousLearningEngine:
    def process_user_message(
        self,
        user_message: str,
        sender: str = "Lead Reliability Engineer",
        session_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Extracts any teaching from user message and saves to persistent SQLite memory.
        """
        extracted = extract_teaching_intent(user_message)
        if not extracted:
            return None

        key, fact_content, category = extracted
        fact_id = f"fact-{uuid.uuid4().hex[:8]}"

        record = memory_store.add_learned_fact(
            fact_id=fact_id,
            key=key,
            fact=fact_content,
            category=category,
            taught_by=sender,
            confidence=0.98,
            source_session_id=session_id
        )

        return {
            "learned": True,
            "fact_id": fact_id,
            "key": key,
            "fact": fact_content,
            "category": category,
            "taught_by": sender,
            "timestamp": record["created_at"],
            "ack_message": f"💡 **Continuous Learning Recorded**: Learned and stored into long-term company memory: *\"{fact_content}\"* (Category: `{category}`). Future queries will reflect this update."
        }

    def manual_teach(
        self,
        fact: str,
        category: str = "general",
        key: Optional[str] = None,
        taught_by: str = "Authorized Employee"
    ) -> Dict[str, Any]:
        """Explicit teaching via UI button or API endpoint."""
        fact_id = f"fact-{uuid.uuid4().hex[:8]}"
        fact_key = key or f"rule_{uuid.uuid4().hex[:6]}"
        record = memory_store.add_learned_fact(
            fact_id=fact_id,
            key=fact_key,
            fact=fact,
            category=category,
            taught_by=taught_by,
            confidence=1.0
        )
        return record

    def get_all_learned_memories(self) -> List[Dict[str, Any]]:
        return memory_store.get_all_learned_facts()

    def remove_learned_memory(self, fact_id: str) -> bool:
        return memory_store.delete_learned_fact(fact_id)

learning_engine = ContinuousLearningEngine()
