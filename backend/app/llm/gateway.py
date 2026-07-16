from __future__ import annotations

import json
from typing import Any

from openai import AsyncOpenAI

from app.config import settings
from app.llm.prompts import (
    DIAGNOSIS_SYSTEM,
    DOCUMENTATION_SYSTEM,
    KNOWLEDGE_SYSTEM,
    TREATMENT_SYSTEM,
)


def get_client() -> AsyncOpenAI | None:
    if not settings.use_openrouter:
        return None
    return AsyncOpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        default_headers={
            "HTTP-Referer": "https://longcare-cdss.local",
            "X-Title": "LongCare CDSS",
        },
    )


async def chat_json(
    system: str,
    user: str,
    model: str | None = None,
) -> dict[str, Any] | None:
    client = get_client()
    if not client:
        return None
    try:
        response = await client.chat.completions.create(
            model=model or settings.openrouter_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content)
    except Exception:
        return None


async def chat_text(system: str, user: str, model: str | None = None) -> str | None:
    client = get_client()
    if not client:
        return None
    try:
        response = await client.chat.completions.create(
            model=model or settings.openrouter_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
        )
        return response.choices[0].message.content
    except Exception:
        return None


async def vision_analyze(prompt: str, image_b64: str, mime: str = "image/jpeg") -> str | None:
    client = get_client()
    if not client:
        return None
    try:
        response = await client.chat.completions.create(
            model=settings.openrouter_vision_model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime};base64,{image_b64}"},
                        },
                    ],
                }
            ],
            temperature=0.1,
        )
        return response.choices[0].message.content
    except Exception:
        return None


async def embed_texts(texts: list[str]) -> list[list[float]] | None:
    client = get_client()
    if not client:
        return None
    try:
        response = await client.embeddings.create(
            model=settings.openrouter_embedding_model,
            input=texts,
        )
        return [item.embedding for item in response.data]
    except Exception:
        return None


# Prompt helpers re-export
__all__ = [
    "chat_json",
    "chat_text",
    "vision_analyze",
    "embed_texts",
    "get_client",
    "DIAGNOSIS_SYSTEM",
    "TREATMENT_SYSTEM",
    "KNOWLEDGE_SYSTEM",
    "DOCUMENTATION_SYSTEM",
]
