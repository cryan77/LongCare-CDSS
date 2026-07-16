from __future__ import annotations

import json
import logging
from typing import Any

from openai import AsyncOpenAI

from app.config import settings
from app.llm.prompts import (
    DIAGNOSIS_SYSTEM,
    DOCUMENTATION_SYSTEM,
    KNOWLEDGE_SYSTEM,
    TREATMENT_SYSTEM,
)

logger = logging.getLogger(__name__)


class LLMError(RuntimeError):
    """Raised when OpenRouter is required but unavailable or fails."""


def require_openrouter() -> None:
    if not settings.openrouter_api_key.strip():
        raise LLMError(
            "OPENROUTER_API_KEY is missing. Add it to backend/.env and set LLM_PROVIDER=openrouter."
        )
    if settings.llm_provider.lower() == "mock":
        raise LLMError("LLM_PROVIDER is set to mock. Set LLM_PROVIDER=openrouter to use live AI.")


def get_client() -> AsyncOpenAI:
    require_openrouter()
    return AsyncOpenAI(
        api_key=settings.openrouter_api_key.strip(),
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
) -> dict[str, Any]:
    client = get_client()
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
    except LLMError:
        raise
    except Exception as exc:
        logger.exception("OpenRouter chat_json failed")
        raise LLMError(f"OpenRouter request failed: {exc}") from exc


async def chat_text(system: str, user: str, model: str | None = None) -> str:
    client = get_client()
    try:
        response = await client.chat.completions.create(
            model=model or settings.openrouter_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
        )
        content = response.choices[0].message.content
        if not content:
            raise LLMError("OpenRouter returned an empty response")
        return content
    except LLMError:
        raise
    except Exception as exc:
        logger.exception("OpenRouter chat_text failed")
        raise LLMError(f"OpenRouter request failed: {exc}") from exc


async def vision_analyze(prompt: str, image_b64: str, mime: str = "image/jpeg") -> str:
    client = get_client()
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
        content = response.choices[0].message.content
        if not content:
            raise LLMError("OpenRouter vision returned an empty response")
        return content
    except LLMError:
        raise
    except Exception as exc:
        logger.exception("OpenRouter vision failed")
        raise LLMError(f"OpenRouter vision request failed: {exc}") from exc


async def embed_texts(texts: list[str]) -> list[list[float]]:
    client = get_client()
    try:
        response = await client.embeddings.create(
            model=settings.openrouter_embedding_model,
            input=texts,
        )
        return [item.embedding for item in response.data]
    except LLMError:
        raise
    except Exception as exc:
        logger.exception("OpenRouter embeddings failed")
        raise LLMError(f"OpenRouter embeddings failed: {exc}") from exc


__all__ = [
    "LLMError",
    "chat_json",
    "chat_text",
    "vision_analyze",
    "embed_texts",
    "get_client",
    "require_openrouter",
    "DIAGNOSIS_SYSTEM",
    "TREATMENT_SYSTEM",
    "KNOWLEDGE_SYSTEM",
    "DOCUMENTATION_SYSTEM",
]
