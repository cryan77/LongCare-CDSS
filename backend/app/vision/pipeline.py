from __future__ import annotations

import base64
import uuid
from typing import Any

from app.llm.gateway import require_openrouter, vision_analyze
from app.llm.prompts import VISION_PROMPT


async def analyze_image(
    data: bytes,
    filename: str = "image.jpg",
    patient_id: int | None = None,
) -> dict[str, Any]:
    require_openrouter()
    image_id = f"img-{uuid.uuid4().hex[:12]}"
    mime = "image/png" if filename.lower().endswith(".png") else "image/jpeg"
    b64 = base64.b64encode(data).decode("ascii")

    findings_text = await vision_analyze(VISION_PROMPT, b64, mime=mime)
    abnormalities = _extract_abnormalities(findings_text)

    return {
        "image_id": image_id,
        "patient_id": patient_id,
        "filename": filename,
        "findings": findings_text,
        "abnormalities": abnormalities,
        "confidence": 0.75,
        "provider": "openrouter",
    }


def _extract_abnormalities(text: str) -> list[str]:
    lines = [ln.strip("-• ").strip() for ln in text.splitlines() if ln.strip()]
    hits = [
        ln
        for ln in lines
        if any(k in ln.lower() for k in ("opacit", "effusion", "consolid", "infiltrat", "pneumo", "abnormal"))
    ]
    return hits[:5] or ["see findings text"]
