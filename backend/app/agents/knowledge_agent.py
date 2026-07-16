from __future__ import annotations

from app.config import settings
from app.llm.gateway import chat_text
from app.llm.prompts import KNOWLEDGE_SYSTEM
from app.rag.retriever import format_citations, retrieve_evidence


async def run_knowledge_agent(question: str, patient_context: str = "") -> dict:
    query = f"{question} {patient_context}".strip()
    docs = await retrieve_evidence(query, top_k=4)
    citations = format_citations(docs)

    if settings.use_openrouter:
        context = "\n\n".join(d["text"] for d in docs)
        content = await chat_text(
            KNOWLEDGE_SYSTEM,
            f"Evidence:\n{context}\n\nPatient context: {patient_context}\n\nQuestion: {question}",
        )
        if content:
            return {"content": content, "citations": citations}

    return {"content": _mock_answer(question, docs), "citations": citations}


def _mock_answer(question: str, docs: list[dict]) -> str:
    if not docs:
        return (
            "I could not retrieve specific guideline evidence for this question. "
            "Please consult current clinical references and use your clinical judgment. "
            "**This AI output requires physician review before clinical action.**"
        )

    top = docs[0]
    source = top["metadata"].get("source", "clinical guidelines")
    year = top["metadata"].get("year", "")
    return (
        f"Based on retrieved evidence from {source} ({year}):\n\n"
        f"{top['text']}\n\n"
        f"Additional relevant sources were identified ({len(docs)} documents). "
        f"Review full citations before applying to patient care.\n\n"
        f"**Physician approval required** — this is decision support, not a diagnosis."
    )
