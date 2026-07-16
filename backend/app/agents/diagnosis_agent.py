from __future__ import annotations

import json
from typing import Any

from app.agents.tools import calculate_bmi, curb65_score
from app.config import settings
from app.llm.gateway import chat_json, require_openrouter
from app.llm.prompts import DIAGNOSIS_SYSTEM
from app.rag.retriever import format_citations, retrieve_evidence


SYMPTOM_DISEASE_MAP = {
    "fever": ["pneumonia", "uti", "influenza"],
    "cough": ["pneumonia", "copd", "bronchitis"],
    "dyspnea": ["pneumonia", "copd", "heart failure"],
    "chest pain": ["pneumonia", "angina", "pe"],
    "dysuria": ["uti"],
    "polyuria": ["diabetes"],
    "polydipsia": ["diabetes"],
    "headache": ["hypertension", "migraine"],
    "wheezing": ["copd", "asthma"],
    "palpitations": ["atrial fibrillation", "anxiety"],
}


async def run_diagnosis_agent(
    patient: dict[str, Any],
    symptoms: list[str],
    labs: dict[str, Any],
    images: list[str],
) -> dict[str, Any]:
    heuristic = _heuristic_diagnosis(patient, symptoms, labs, images)
    evidence_docs = await retrieve_evidence(
        f"{' '.join(symptoms)} {heuristic['diagnosis'][0]['name']}",
        disease=_disease_key(heuristic["diagnosis"][0]["name"]),
    )
    evidence = format_citations(evidence_docs)

    if settings.llm_provider.lower() == "mock":
        heuristic["evidence"] = evidence
        return heuristic

    require_openrouter()
    llm = await chat_json(
        DIAGNOSIS_SYSTEM,
        json.dumps(
            {
                "patient": patient,
                "symptoms": symptoms,
                "labs": labs,
                "images": images,
                "evidence": evidence,
                "clinical_context_hint": heuristic,
            }
        ),
    )
    if "diagnosis" not in llm or not llm["diagnosis"]:
        raise RuntimeError("OpenRouter diagnosis response missing diagnosis field")

    return {
        "diagnosis": llm["diagnosis"],
        "differential": llm.get("differential", heuristic["differential"]),
        "reasoning": llm.get("reasoning", heuristic["reasoning"]),
        "evidence": evidence,
        "confidence": float(llm.get("confidence", heuristic["confidence"])),
        "safety_flags": llm.get("safety_flags", [])
        + ["AI output requires physician review before clinical action"],
        "provider": "openrouter",
    }


def _disease_key(name: str) -> str | None:
    key = name.lower().replace("community acquired ", "")
    allowed = {"pneumonia", "hypertension", "diabetes", "copd", "uti", "atrial fibrillation"}
    return key if key in allowed else None


def _heuristic_diagnosis(
    patient: dict[str, Any],
    symptoms: list[str],
    labs: dict[str, Any],
    images: list[str],
) -> dict[str, Any]:
    """Lightweight prior used only as context for the LLM (or mock mode)."""
    scores: dict[str, float] = {}
    symptoms_lower = [s.lower() for s in symptoms]

    for symptom in symptoms_lower:
        for disease in SYMPTOM_DISEASE_MAP.get(symptom, []):
            scores[disease] = scores.get(disease, 0) + 0.25

    wbc = labs.get("WBC") or labs.get("wbc")
    if wbc and float(wbc) > 11000:
        scores["pneumonia"] = scores.get("pneumonia", 0) + 0.3

    if not scores:
        scores["unspecified viral illness"] = 0.45

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary = ranked[0]
    confidence = min(0.95, primary[1] + 0.35)
    differential = [d.title() for d, _ in ranked[1:4]]

    reasoning_parts = [
        f"Patient is a {patient.get('age')}-year-old {patient.get('gender')} presenting with {', '.join(symptoms) or 'unspecified symptoms'}.",
    ]
    if wbc:
        reasoning_parts.append(f"WBC: {wbc}.")
    if images:
        reasoning_parts.append(f"Imaging context: {len(images)} study/ids.")
    vitals = patient.get("vitals") or {}
    if vitals.get("weight_kg") and vitals.get("height_m"):
        reasoning_parts.append(
            f"BMI: {calculate_bmi(float(vitals['weight_kg']), float(vitals['height_m']))}."
        )
    if "cough" in symptoms_lower and "fever" in symptoms_lower:
        curb = curb65_score(False, False, False, False, patient.get("age", 0) >= 65)
        reasoning_parts.append(f"CURB-65: {curb['score']} ({curb['risk_level']}).")

    return {
        "diagnosis": [{"name": primary[0].title(), "probability": round(confidence, 2)}],
        "differential": differential,
        "reasoning": " ".join(reasoning_parts),
        "evidence": [],
        "confidence": round(confidence, 2),
        "safety_flags": [],
    }
