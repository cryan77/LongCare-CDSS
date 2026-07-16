from __future__ import annotations

from typing import Any

from app.agents.tools import calculate_bmi, curb65_score
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


def run_diagnosis_agent(
    patient: dict[str, Any],
    symptoms: list[str],
    labs: dict[str, Any],
    images: list[str],
) -> dict[str, Any]:
    scores: dict[str, float] = {}
    symptoms_lower = [s.lower() for s in symptoms]

    for symptom in symptoms_lower:
        for disease in SYMPTOM_DISEASE_MAP.get(symptom, []):
            scores[disease] = scores.get(disease, 0) + 0.25

    wbc = labs.get("WBC") or labs.get("wbc")
    if wbc and float(wbc) > 11000:
        scores["pneumonia"] = scores.get("pneumonia", 0) + 0.3
        scores["uti"] = scores.get("uti", 0) + 0.15

    if labs.get("HbA1c") and float(labs["HbA1c"]) > 6.5:
        scores["diabetes"] = scores.get("diabetes", 0) + 0.5

    if not scores:
        scores["unspecified viral illness"] = 0.45

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary = ranked[0]
    confidence = min(0.95, primary[1] + 0.35)
    differential = [d for d, _ in ranked[1:4]]

    reasoning_parts = [
        f"Patient is a {patient.get('age')}-year-old {patient.get('gender')} presenting with {', '.join(symptoms) or 'unspecified symptoms'}.",
    ]

    if wbc:
        reasoning_parts.append(f"Elevated WBC ({wbc}) supports infectious etiology.")
    if images:
        reasoning_parts.append(f"Imaging analysis requested for {len(images)} study(ies); correlate with clinical findings.")

    vitals = patient.get("vitals") or {}
    if vitals.get("weight_kg") and vitals.get("height_m"):
        bmi = calculate_bmi(float(vitals["weight_kg"]), float(vitals["height_m"]))
        reasoning_parts.append(f"Calculated BMI: {bmi}.")

    if "cough" in symptoms_lower and "fever" in symptoms_lower:
        curb = curb65_score(False, False, False, False, patient.get("age", 0) >= 65)
        reasoning_parts.append(f"CURB-65 score: {curb['score']} ({curb['risk_level']} risk).")

    disease_key = primary[0].replace(" ", "_").replace("-", "_")
    if primary[0] == "pneumonia":
        disease_key = "pneumonia"
    elif primary[0] == "hypertension":
        disease_key = "hypertension"
    elif primary[0] == "diabetes":
        disease_key = "diabetes"

    evidence_docs = retrieve_evidence(
        f"{primary[0]} {' '.join(symptoms)}",
        disease=disease_key if disease_key in {"pneumonia", "hypertension", "diabetes", "copd", "uti", "atrial fibrillation"} else None,
    )
    evidence = format_citations(evidence_docs)

    safety_flags: list[str] = []
    if confidence < 0.6:
        safety_flags.append("Low confidence — additional workup recommended")
    if not evidence:
        safety_flags.append("Limited evidence retrieved — verify against current guidelines")

    return {
        "diagnosis": [{"name": primary[0].title(), "probability": round(confidence, 2)}],
        "differential": [d.title() for d in differential],
        "reasoning": " ".join(reasoning_parts),
        "evidence": evidence,
        "confidence": round(confidence, 2),
        "safety_flags": safety_flags,
    }
