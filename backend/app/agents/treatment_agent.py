from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.agents.tools import check_allergies
from app.config import settings
from app.llm.gateway import chat_json
from app.llm.prompts import TREATMENT_SYSTEM
from app.rag.retriever import format_citations, retrieve_evidence

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def _load_json(name: str) -> list[dict]:
    with open(DATA_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def _medications_for(diagnosis_name: str) -> list[dict]:
    drugs = _load_json("drugs.json")
    key = diagnosis_name.lower()
    matches = []
    for drug in drugs:
        if key in [i.lower() for i in drug.get("indications", [])]:
            matches.append(
                {
                    "name": drug["name"],
                    "dose": drug["dose"].split("-")[-1] if "-" in drug["dose"] and "mg" in drug["dose"] else drug["dose"],
                    "frequency": drug["frequency"],
                    "duration": drug["duration"],
                    "allergy_tags": drug.get("allergy_tags", []),
                }
            )
    if not matches:
        return [{"name": "Supportive care", "dose": "—", "frequency": "As needed", "duration": "Until resolved", "allergy_tags": []}]
    return matches[:3]


def _interaction_warnings(med_names: list[str]) -> list[str]:
    interactions = _load_json("interactions.json")
    meds = {m.lower() for m in med_names}
    warnings = []
    for row in interactions:
        pair = {p.lower() for p in row["pair"]}
        if pair.issubset(meds):
            warnings.append(row["warning"])
    return warnings


def _contraindications(patient: dict[str, Any], medications: list[dict]) -> list[str]:
    warnings: list[str] = []
    history = (patient.get("medical_history") or {}).get("conditions", [])
    history_l = [c.lower() for c in history]
    if patient.get("age", 0) >= 65:
        warnings.append("Geriatric patient — consider dose adjustment and renal function")
    for med in medications:
        if med["name"].lower() == "metformin" and "ckd" in history_l:
            warnings.append("Metformin caution in CKD — verify eGFR")
        if med["name"].lower() == "lisinopril" and patient.get("pregnant"):
            warnings.append("ACE inhibitors contraindicated in pregnancy")
    return warnings


async def run_treatment_agent(
    diagnosis_name: str,
    patient: dict[str, Any],
    current_meds: list[str] | None = None,
) -> dict[str, Any]:
    medications = _medications_for(diagnosis_name)
    allergies = patient.get("allergies") or []
    warnings: list[str] = []

    for med in medications:
        if med["name"] != "Supportive care":
            warnings.extend(check_allergies(med["name"], allergies))
            for tag in med.get("allergy_tags", []):
                for allergy in allergies:
                    if tag.lower() in allergy.lower():
                        warnings.append(
                            f"ALLERGY ALERT: Patient allergic to {allergy} — {med['name']} may be contraindicated"
                        )

    all_meds = [m["name"] for m in medications] + (current_meds or [])
    history_meds = (patient.get("medical_history") or {}).get("medications", [])
    for hm in history_meds:
        all_meds.append(hm.split()[0])
    warnings.extend(_interaction_warnings(all_meds))
    warnings.extend(_contraindications(patient, medications))

    disease_key = diagnosis_name.lower().replace("community acquired ", "")
    guidelines = format_citations(
        await retrieve_evidence(f"{diagnosis_name} treatment", disease=disease_key if disease_key else None)
    )

    result = {
        "medications": [
            {k: v for k, v in m.items() if k != "allergy_tags"} for m in medications
        ],
        "warnings": list(dict.fromkeys(warnings)),
        "guidelines": guidelines,
        "safety_checks": {
            "allergy_screened": True,
            "interaction_screened": True,
            "contraindications_checked": True,
        },
    }

    if settings.llm_provider.lower() == "mock":
        return result

    from app.llm.gateway import require_openrouter

    require_openrouter()
    llm = await chat_json(
        TREATMENT_SYSTEM,
        json.dumps({"diagnosis": diagnosis_name, "patient": patient, "safety_context": result}),
    )
    if "medications" not in llm or not llm["medications"]:
        raise RuntimeError("OpenRouter treatment response missing medications")

    result["medications"] = llm["medications"]
    result["warnings"] = list(
        dict.fromkeys(result["warnings"] + llm.get("warnings", []) + ["Physician approval required"])
    )
    if llm.get("guidelines"):
        result["guidelines"] = llm["guidelines"]
    result["provider"] = "openrouter"
    return result
