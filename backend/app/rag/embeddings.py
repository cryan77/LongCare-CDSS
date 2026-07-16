from __future__ import annotations

import re

import numpy as np

from app.config import settings
from app.llm.gateway import embed_texts, require_openrouter


def local_embed(text: str, dim: int = 128) -> list[float]:
    """Offline fallback embedding (mock mode only)."""
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
    if settings.llm_provider.lower() == "mock":
        return local_embed(text)
    require_openrouter()
    vectors = await embed_texts([text])
    return vectors[0]


async def embed_documents(texts: list[str]) -> list[list[float]]:
    if settings.llm_provider.lower() == "mock":
        return [local_embed(t) for t in texts]
    require_openrouter()
    return await embed_texts(texts)
