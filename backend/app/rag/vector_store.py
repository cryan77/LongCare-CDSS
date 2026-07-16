from __future__ import annotations

import re
from typing import Any

import numpy as np

from app.config import settings
from app.data_loader import load_guidelines
from app.rag.embeddings import embed_documents, embed_query, local_embed


class VectorStore:
    def __init__(self) -> None:
        self.documents: list[dict] = []
        self.embeddings: np.ndarray | None = None
        self._loaded = False

    async def load(self) -> None:
        if self._loaded and self.documents:
            return
        self.documents = load_guidelines()
        if settings.vector_backend == "qdrant":
            await self._load_qdrant()
        else:
            vectors = await embed_documents([d["text"] for d in self.documents])
            self.embeddings = np.array(vectors, dtype=np.float64)
        self._loaded = True

    async def _load_qdrant(self) -> None:
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.http import models as qm

            client = QdrantClient(url=settings.qdrant_url)
            collection = settings.qdrant_collection
            vectors = await embed_documents([d["text"] for d in self.documents])
            dim = len(vectors[0]) if vectors else 128

            existing = [c.name for c in client.get_collections().collections]
            if collection not in existing:
                client.create_collection(
                    collection_name=collection,
                    vectors_config=qm.VectorParams(size=dim, distance=qm.Distance.COSINE),
                )

            points = []
            for i, (doc, vec) in enumerate(zip(self.documents, vectors)):
                points.append(
                    qm.PointStruct(
                        id=i + 1,
                        vector=vec,
                        payload={
                            "id": doc["id"],
                            "text": doc["text"],
                            "disease": doc["metadata"].get("disease"),
                            "source": doc["metadata"].get("source"),
                            "year": doc["metadata"].get("year"),
                            "metadata": doc["metadata"],
                        },
                    )
                )
            client.upsert(collection_name=collection, points=points)
            self.embeddings = np.array(vectors, dtype=np.float64)
        except Exception:
            # Fallback to in-memory
            vectors = await embed_documents([d["text"] for d in self.documents])
            self.embeddings = np.array(vectors, dtype=np.float64)

    async def search(self, query: str, top_k: int = 3, disease: str | None = None) -> list[dict]:
        await self.load()
        assert self.embeddings is not None

        if settings.vector_backend == "qdrant":
            try:
                return await self._search_qdrant(query, top_k, disease)
            except Exception:
                pass

        query_vec = np.array(await embed_query(query), dtype=np.float64)
        # Align dims if mismatch
        if query_vec.shape[0] != self.embeddings.shape[1]:
            query_vec = np.array(local_embed(query, dim=self.embeddings.shape[1]))

        scores = self.embeddings @ query_vec
        query_tokens = set(re.findall(r"[a-z0-9]+", query.lower()))
        for i, doc in enumerate(self.documents):
            doc_tokens = set(re.findall(r"[a-z0-9]+", doc["text"].lower()))
            scores[i] += len(query_tokens & doc_tokens) * 0.15
            if disease and doc["metadata"].get("disease") == disease:
                scores[i] += 0.25

        # Light rerank: boost exact disease + source diversity
        ranked = np.argsort(scores)[::-1]
        results: list[dict] = []
        seen_sources: set[str] = set()
        for idx in ranked:
            doc = self.documents[int(idx)]
            source = doc["metadata"].get("source", "")
            boosted = float(scores[int(idx)])
            if source not in seen_sources:
                boosted += 0.05
            results.append({**doc, "score": boosted})
            seen_sources.add(source)
            if len(results) >= top_k:
                break
        results.sort(key=lambda d: d["score"], reverse=True)
        return results

    async def _search_qdrant(self, query: str, top_k: int, disease: str | None) -> list[dict]:
        from qdrant_client import QdrantClient
        from qdrant_client.http import models as qm

        client = QdrantClient(url=settings.qdrant_url)
        query_vec = await embed_query(query)
        query_filter = None
        if disease:
            query_filter = qm.Filter(
                must=[qm.FieldCondition(key="disease", match=qm.MatchValue(value=disease))]
            )
        hits = client.search(
            collection_name=settings.qdrant_collection,
            query_vector=query_vec,
            query_filter=query_filter,
            limit=top_k,
        )
        results = []
        for hit in hits:
            payload = hit.payload or {}
            results.append(
                {
                    "id": payload.get("id"),
                    "text": payload.get("text"),
                    "metadata": payload.get("metadata")
                    or {
                        "disease": payload.get("disease"),
                        "source": payload.get("source"),
                        "year": payload.get("year"),
                    },
                    "score": float(hit.score),
                }
            )
        return results


vector_store = VectorStore()
