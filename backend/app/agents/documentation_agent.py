from __future__ import annotations

import json
from typing import Any

from app.config import settings
from app.llm.gateway import chat_json, require_openrouter
from app.llm.prompts import DOCUMENTATION_SYSTEM


async def run_documentation_agent(
    doc_type: str,
    patient: dict[str, Any],
    encounter: dict[str, Any],
    diagnosis: dict[str, Any] | None = None,
    treatment: dict[str, Any] | None = None,
) -> dict[str, Any]:
    template = _template_doc(doc_type, patient, encounter, diagnosis, treatment)

    if settings.llm_provider.lower() == "mock":
        return template

    require_openrouter()
    llm = await chat_json(
        DOCUMENTATION_SYSTEM,
        json.dumps(
            {
                "doc_type": doc_type,
                "patient": patient,
                "encounter": encounter,
                "diagnosis": diagnosis,
                "treatment": treatment,
            }
        ),
    )
    # Prefer LLM fields, keep template keys as fallback
    merged = {**template, **{k: v for k, v in llm.items() if isinstance(v, (str, list))}}
    merged["provider"] = "openrouter"
    return merged


def _template_doc(
    doc_type: str,
    patient: dict[str, Any],
    encounter: dict[str, Any],
    diagnosis: dict[str, Any] | None,
    treatment: dict[str, Any] | None,
) -> dict[str, Any]:
    patient_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip()
    complaint = encounter.get("chief_complaint", "Not documented")
    dx_name = ""
    if diagnosis:
        items = diagnosis.get("diagnosis") or []
        if items:
            dx_name = items[0].get("name", "")

    if doc_type == "discharge":
        return {
            "admission_reason": complaint,
            "hospital_course": diagnosis.get("reasoning", "See encounter notes.") if diagnosis else "Unremarkable course.",
            "diagnosis": dx_name or "Pending",
            "medications": [m.get("name") for m in (treatment or {}).get("medications", [])],
            "follow_up": "Follow up with primary care in 1-2 weeks. Return if symptoms worsen.",
        }

    meds_text = ", ".join(
        f"{m['name']} {m['dose']} {m['frequency']}"
        for m in (treatment or {}).get("medications", [])
    ) or "Supportive care as clinically indicated"

    return {
        "subjective": f"{patient_name} presents with {complaint}. Symptoms as reported during encounter.",
        "objective": f"Vitals: {patient.get('vitals', {})}. Labs and imaging per chart.",
        "assessment": f"{dx_name}. {diagnosis.get('reasoning', '') if diagnosis else ''}".strip(),
        "plan": f"{meds_text}. Patient education provided. Safety netting advice given.",
    }
