from __future__ import annotations

import json
import math
import re
from pathlib import Path

import numpy as np

from app.data_loader import load_guidelines


class VectorStore:
    def __init__(self) -> None:
        self.documents: list[dict] = []
        self.embeddings: np.ndarray | None = None

    def load(self) -> None:
        self.documents = load_guidelines()
        self.embeddings = np.array([self._embed(doc["text"]) for doc in self.documents])

    def _embed(self, text: str) -> np.ndarray:
        """Deterministic bag-of-words style embedding for demo (no API key required)."""
        dim = 128
        vec = np.zeros(dim)
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        for token in tokens:
            idx = hash(token) % dim
            vec[idx] += 1.0
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 0 else vec

    def search(self, query: str, top_k: int = 3, disease: str | None = None) -> list[dict]:
        if not self.documents:
            self.load()
        assert self.embeddings is not None

        query_vec = self._embed(query)
        scores = self.embeddings @ query_vec

        # Keyword boost (hybrid retrieval)
        query_tokens = set(re.findall(r"[a-z0-9]+", query.lower()))
        for i, doc in enumerate(self.documents):
            doc_tokens = set(re.findall(r"[a-z0-9]+", doc["text"].lower()))
            overlap = len(query_tokens & doc_tokens)
            scores[i] += overlap * 0.15
            if disease and doc["metadata"].get("disease") == disease:
                scores[i] += 0.25

        top_indices = np.argsort(scores)[::-1][:top_k]
        results = []
        for idx in top_indices:
            results.append({
                **self.documents[int(idx)],
                "score": float(scores[int(idx)]),
            })
        return results


vector_store = VectorStore()
