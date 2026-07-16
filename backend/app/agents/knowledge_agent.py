from __future__ import annotations

from app.config import settings
from app.rag.retriever import format_citations, retrieve_evidence


async def run_knowledge_agent(question: str, patient_context: str = "") -> dict:
    query = f"{question} {patient_context}".strip()
    docs = retrieve_evidence(query, top_k=4)
    citations = format_citations(docs)

    if settings.llm_provider == "openai" and settings.openai_api_key:
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.openai_api_key)
            context = "\n\n".join(d["text"] for d in docs)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a clinical knowledge assistant for physicians. "
                            "Answer based only on provided evidence. Cite sources. "
                            "Always remind that AI suggestions require physician review."
                        ),
                    },
                    {"role": "user", "content": f"Evidence:\n{context}\n\nQuestion: {question}"},
                ],
                temperature=0.2,
            )
            content = response.choices[0].message.content or ""
        except Exception:
            content = _mock_answer(question, docs)
    else:
        content = _mock_answer(question, docs)

    return {"content": content, "citations": citations}


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
