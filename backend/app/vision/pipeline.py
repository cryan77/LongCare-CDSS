from __future__ import annotations

import base64
import uuid
from typing import Any

from app.config import settings
from app.llm.gateway import vision_analyze
from app.llm.prompts import VISION_PROMPT


async def analyze_image(
    data: bytes,
    filename: str = "image.jpg",
    patient_id: int | None = None,
) -> dict[str, Any]:
    image_id = f"img-{uuid.uuid4().hex[:12]}"
    mime = "image/png" if filename.lower().endswith(".png") else "image/jpeg"

    # Preprocessing stub: size check already done; normalize metadata
    b64 = base64.b64encode(data).decode("ascii")

    findings_text = None
    if settings.use_openrouter:
        findings_text = await vision_analyze(VISION_PROMPT, b64, mime=mime)

    if findings_text:
        abnormalities = _extract_abnormalities(findings_text)
        return {
            "image_id": image_id,
            "patient_id": patient_id,
            "filename": filename,
            "findings": findings_text,
            "abnormalities": abnormalities,
            "confidence": 0.72,
            "provider": "openrouter",
        }

    # Mock findings for offline demo
    return {
        "image_id": image_id,
        "patient_id": patient_id,
        "filename": filename,
        "findings": (
            "Mock Vision Analysis: Lung fields show possible increased opacity in the right lower "
            "zone. Cardiac silhouette within expected limits. No definitive pneumothorax identified. "
            "Correlate clinically — radiologist review required."
        ),
        "abnormalities": ["possible right lower lobe opacity", "suggest pneumonia correlation"],
        "confidence": 0.55,
        "provider": "mock",
    }


def _extract_abnormalities(text: str) -> list[str]:
    lines = [ln.strip("-• ").strip() for ln in text.splitlines() if ln.strip()]
    hits = [ln for ln in lines if any(k in ln.lower() for k in ("opacit", "effusion", "consolid", "infiltrat", "pneumo"))]
    return hits[:5] or ["see findings text"]
