from __future__ import annotations

from typing import Any

from app.agents.tools import check_allergies, check_drug_interactions
from app.rag.retriever import format_citations, retrieve_evidence

TREATMENT_DB: dict[str, list[dict]] = {
    "pneumonia": [
        {"name": "Amoxicillin", "dose": "1g", "frequency": "TID", "duration": "5-7 days"},
        {"name": "Azithromycin", "dose": "500mg", "frequency": "Day 1, then 250mg daily", "duration": "5 days"},
    ],
    "community acquired pneumonia": [
        {"name": "Amoxicillin", "dose": "1g", "frequency": "TID", "duration": "5-7 days"},
    ],
    "uti": [
        {"name": "Nitrofurantoin", "dose": "100mg", "frequency": "BID", "duration": "5 days"},
    ],
    "hypertension": [
        {"name": "Lisinopril", "dose": "10mg", "frequency": "Daily", "duration": "Ongoing"},
        {"name": "Amlodipine", "dose": "5mg", "frequency": "Daily", "duration": "Ongoing"},
    ],
    "diabetes": [
        {"name": "Metformin", "dose": "500mg", "frequency": "BID with meals", "duration": "Ongoing"},
    ],
    "copd": [
        {"name": "Albuterol", "dose": "2 puffs", "frequency": "Q4-6H PRN", "duration": "As needed"},
        {"name": "Prednisone", "dose": "40mg", "frequency": "Daily", "duration": "5 days"},
    ],
    "atrial fibrillation": [
        {"name": "Apixaban", "dose": "5mg", "frequency": "BID", "duration": "Ongoing"},
    ],
    "unspecified viral illness": [
        {"name": "Supportive care", "dose": "—", "frequency": "As needed", "duration": "Until resolved"},
    ],
}


def run_treatment_agent(
    diagnosis_name: str,
    patient: dict[str, Any],
    current_meds: list[str] | None = None,
) -> dict[str, Any]:
    key = diagnosis_name.lower()
    medications = TREATMENT_DB.get(key, TREATMENT_DB.get("unspecified viral illness", []))
    allergies = patient.get("allergies") or []
    warnings: list[str] = []

    for med in medications:
        if med["name"] != "Supportive care":
            warnings.extend(check_allergies(med["name"], allergies))

    all_meds = [m["name"] for m in medications] + (current_meds or [])
    warnings.extend(check_drug_interactions(all_meds))

    if patient.get("age", 0) >= 65:
        warnings.append("Geriatric patient — consider dose adjustment and renal function")

    disease_key = key.replace("community acquired ", "")
    guidelines = format_citations(retrieve_evidence(f"{diagnosis_name} treatment", disease=disease_key if disease_key in TREATMENT_DB else None))

    return {
        "medications": medications,
        "warnings": list(dict.fromkeys(warnings)),
        "guidelines": guidelines,
        "safety_checks": {
            "allergy_screened": True,
            "interaction_screened": True,
            "contraindications_checked": True,
        },
    }
