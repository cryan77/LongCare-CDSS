from __future__ import annotations

import re

import numpy as np

from app.config import settings


def local_embed(text: str, dim: int = 128) -> list[float]:
    """Deterministic bag-of-words embedding for mock / offline mode."""
    vec = np.zeros(dim, dtype=np.float64)
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    for token in tokens:
        idx = hash(token) % dim
        vec[idx] += 1.0
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


async def embed_query(text: str) -> list[float]:
    if settings.use_openrouter:
        from app.llm.gateway import embed_texts

        vectors = await embed_texts([text])
        if vectors:
            return vectors[0]
    return local_embed(text)


async def embed_documents(texts: list[str]) -> list[list[float]]:
    if settings.use_openrouter:
        from app.llm.gateway import embed_texts

        vectors = await embed_texts(texts)
        if vectors and len(vectors) == len(texts):
            return vectors
    return [local_embed(t) for t in texts]
