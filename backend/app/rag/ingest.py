"""Ingest guidelines into the vector store (memory or Qdrant)."""

from __future__ import annotations

from app.rag.vector_store import vector_store


async def ingest_guidelines(force: bool = False) -> dict:
    if force:
        vector_store._loaded = False
        vector_store.documents = []
        vector_store.embeddings = None
    await vector_store.load()
    return {
        "documents": len(vector_store.documents),
        "backend": __import__("app.config", fromlist=["settings"]).settings.vector_backend,
        "status": "ready",
    }
