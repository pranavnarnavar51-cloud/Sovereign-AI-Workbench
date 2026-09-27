"""
Unit and Integration Tests for Sovereign Continuous Learning & RAG Memory
Validates:
1. Demo company documentation pre-seeding
2. Continuous employee teaching extraction & storage
3. Fact recall in subsequent queries
4. Chat session & message persistence
5. Memory CRUD lifecycle
"""
import pytest
import uuid
from stores.knowledge_memory import memory_store
from ingestion.learning_engine import learning_engine, extract_teaching_intent
from ingestion.rag_retriever import rag_retriever

def test_company_corpus_seeded():
    """Verify demo company SOPs are loaded in persistent SQLite."""
    docs = memory_store.get_all_documents()
    assert len(docs) >= 6
    doc_ids = [d["id"] for d in docs]
    assert "SOP-MNT-101" in doc_ids
    assert "SOP-SAF-204" in doc_ids
    assert "DIR-EMP-001" in doc_ids

def test_teaching_intent_detection():
    """Verify natural language patterns are recognized as employee teaching."""
    msg1 = "Please remember that the cooling water pressure must stay above 4.5 bar."
    res1 = extract_teaching_intent(msg1)
    assert res1 is not None
    key, fact, cat = res1
    assert "cooling water pressure" in fact.lower()
    assert cat in ["equipment", "general", "procedure"]

    msg2 = "The new supervisor for Shift B is Mr. Rajesh Patel ext 4402"
    res2 = extract_teaching_intent(msg2)
    assert res2 is not None
    key, fact, cat = res2
    assert "rajesh patel" in fact.lower()
    assert cat == "personnel"

    # Non-teaching question should return None
    non_teach = "What is the vibration threshold on pump P-104?"
    assert extract_teaching_intent(non_teach) is None

def test_continuous_learning_and_recall():
    """Test full cycle: employee teaches fact -> stored in DB -> recalled in next query."""
    unique_ext = f"ext-{uuid.uuid4().hex[:4]}"
    teach_message = f"Please note that the emergency contact for Plant Medical is {unique_ext}."
    
    # 1. Process employee message
    learn_res = learning_engine.process_user_message(
        user_message=teach_message,
        sender="Lead Reliability Engineer"
    )
    assert learn_res is not None
    assert learn_res["learned"] is True
    assert unique_ext in learn_res["fact"]

    # 2. Query subsequent question
    query = "What is the emergency contact for Plant Medical?"
    retrieved = rag_retriever.retrieve(query, top_k=3)
    assert len(retrieved) > 0
    
    # Verify the learned fact is in top retrieved results
    found = any(unique_ext in r["content"] for r in retrieved)
    assert found is True

def test_memory_crud_lifecycle():
    """Test manual addition, listing, and deletion of learned facts."""
    fact_text = f"Lube oil filter replacement cycle updated to 4500 hours (ID: {uuid.uuid4().hex[:4]})."
    record = learning_engine.manual_teach(
        fact=fact_text,
        category="equipment",
        taught_by="Director M. Sharma"
    )
    assert record["id"].startswith("fact-")

    # Verify present in list
    all_facts = learning_engine.get_all_learned_memories()
    assert any(f["id"] == record["id"] for f in all_facts)

    # Delete
    deleted = learning_engine.remove_learned_memory(record["id"])
    assert deleted is True

    # Verify removed
    all_facts_after = learning_engine.get_all_learned_memories()
    assert not any(f["id"] == record["id"] for f in all_facts_after)

def test_chat_session_and_message_persistence():
    """Test ChatGPT-style session creation, message recording, and retrieval."""
    test_session_id = f"test-sess-{uuid.uuid4().hex[:6]}"
    sess = memory_store.create_session(test_session_id, title="Unit Test Session", model="llama3.2:latest")
    assert sess["id"] == test_session_id

    # Add user message
    msg1 = memory_store.add_message(
        message_id=f"msg-{uuid.uuid4().hex[:4]}",
        session_id=test_session_id,
        sender="Engineer",
        role="user",
        content="Testing persistent conversation."
    )
    # Add assistant message
    msg2 = memory_store.add_message(
        message_id=f"msg-{uuid.uuid4().hex[:4]}",
        session_id=test_session_id,
        sender="Industrial AI",
        role="assistant",
        content="Acknowledged. Session stored."
    )

    history = memory_store.get_messages_for_session(test_session_id)
    assert len(history) == 2
    assert history[0]["content"] == "Testing persistent conversation."
    assert history[1]["content"] == "Acknowledged. Session stored."

    # Clean up
    memory_store.delete_session(test_session_id)
    assert memory_store.get_session(test_session_id) is None
