"""Medical calculator and clinical scoring tools."""

from __future__ import annotations


def calculate_bmi(weight_kg: float, height_m: float) -> float:
    if height_m <= 0:
        return 0.0
    return round(weight_kg / (height_m**2), 1)


def calculate_egfr(creatinine: float, age: int, gender: str, is_black: bool = False) -> float:
    """CKD-EPI simplified approximation for demo purposes."""
    k = 0.7 if gender.lower() == "female" else 0.9
    alpha = -0.329 if gender.lower() == "female" else -0.411
    min_cr = min(creatinine / k, 1)
    max_cr = max(creatinine / k, 1)
    factor = 1.018 if gender.lower() == "female" else 1.0
    race = 1.159 if is_black else 1.0
    egfr = 141 * (min_cr**alpha) * (max_cr ** -1.209) * (0.993**age) * factor * race
    return round(egfr, 1)


def curb65_score(
    confusion: bool,
    urea_high: bool,
    rr_high: bool,
    bp_low: bool,
    age_65: bool,
) -> dict:
    score = sum([confusion, urea_high, rr_high, bp_low, age_65])
    risk = {0: "Low", 1: "Low", 2: "Moderate", 3: "High", 4: "High", 5: "High"}[score]
    return {"score": score, "risk_level": risk, "mortality_estimate": f"{[0.6, 2.7, 6.8, 14, 27.8, 57][score]}%"}


def cha2ds2_vasc(
    chf: bool,
    hypertension: bool,
    age: int,
    diabetes: bool,
    stroke_tia: bool,
    vascular: bool,
    gender_female: bool,
) -> dict:
    score = sum([
        chf,
        hypertension,
        2 if age >= 75 else (1 if age >= 65 else 0),
        diabetes,
        2 if stroke_tia else 0,
        vascular,
        gender_female,
    ])
    return {"score": score, "stroke_risk": "Low" if score <= 1 else ("Moderate" if score <= 3 else "High")}


def check_drug_interactions(medications: list[str]) -> list[str]:
    interactions = {
        frozenset({"warfarin", "aspirin"}): "Increased bleeding risk — monitor INR closely",
        frozenset({"warfarin", "ibuprofen"}): "NSAID increases anticoagulant effect",
        frozenset({"metformin", "contrast dye"}): "Risk of lactic acidosis — hold metformin",
        frozenset({"lisinopril", "potassium"}): "Hyperkalemia risk",
        frozenset({"amoxicillin", "warfarin"}): "May potentiate anticoagulation",
    }
    warnings: list[str] = []
    meds_lower = {m.lower() for m in medications}
    for pair, warning in interactions.items():
        if pair.issubset(meds_lower):
            warnings.append(warning)
    return warnings


def check_allergies(drug: str, allergies: list[str]) -> list[str]:
    drug_lower = drug.lower()
    warnings: list[str] = []
    for allergy in allergies:
        al = allergy.lower()
        if al in drug_lower or (al == "penicillin" and "cillin" in drug_lower):
            warnings.append(f"ALLERGY ALERT: Patient allergic to {allergy} — {drug} may be contraindicated")
    return warnings
