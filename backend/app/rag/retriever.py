from app.rag.vector_store import vector_store


def retrieve_evidence(query: str, disease: str | None = None, top_k: int = 3) -> list[dict]:
    return vector_store.search(query, top_k=top_k, disease=disease)


def format_citations(docs: list[dict]) -> list[dict]:
    return [
        {
            "id": doc["id"],
            "source": doc["metadata"].get("source", "Unknown"),
            "year": doc["metadata"].get("year"),
            "excerpt": doc["text"][:200] + ("..." if len(doc["text"]) > 200 else ""),
            "relevance": round(doc.get("score", 0), 3),
        }
        for doc in docs
    ]
