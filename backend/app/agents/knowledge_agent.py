from __future__ import annotations

from app.config import settings
from app.llm.gateway import chat_text, require_openrouter
from app.llm.prompts import KNOWLEDGE_SYSTEM
from app.rag.retriever import format_citations, retrieve_evidence


async def run_knowledge_agent(question: str, patient_context: str = "") -> dict:
    query = f"{question} {patient_context}".strip()
    docs = await retrieve_evidence(query, top_k=4)
    citations = format_citations(docs)
    context = "\n\n".join(d["text"] for d in docs)

    if settings.llm_provider.lower() == "mock":
        return {"content": _fallback_answer(question, docs), "citations": citations, "provider": "mock"}

    require_openrouter()
    content = await chat_text(
        KNOWLEDGE_SYSTEM,
        f"Evidence:\n{context}\n\nPatient context: {patient_context}\n\nQuestion: {question}",
    )
    return {"content": content, "citations": citations, "provider": "openrouter"}


def _fallback_answer(question: str, docs: list[dict]) -> str:
    if not docs:
        return "No guideline evidence retrieved."
    top = docs[0]
    source = top["metadata"].get("source", "clinical guidelines")
    year = top["metadata"].get("year", "")
    return (
        f"Based on {source} ({year}):\n\n{top['text']}\n\n"
        "**Physician approval required.**"
    )
