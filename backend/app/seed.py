"""Seed demo users and 50 clinically rich mock patients."""

from __future__ import annotations

import random
from sqlalchemy import func, select

from app.database.models import Patient, User
from app.database.session import async_session
from app.security.auth import hash_password

FIRST_NAMES_M = [
    "James", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas",
    "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Steven", "Paul", "Andrew",
    "Joshua", "Kevin", "Brian", "George", "Edward", "Ronald", "Timothy", "Jason", "Jeffrey",
]
FIRST_NAMES_F = [
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica",
    "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Margaret", "Sandra", "Ashley",
    "Dorothy", "Kimberly", "Emily", "Donna", "Michelle", "Carol", "Amanda", "Melissa", "Deborah",
]
LAST_NAMES = [
    "Morrison", "Nguyen", "Patel", "Santos", "Chen", "Williams", "Brown", "Garcia",
    "Martinez", "Rodriguez", "Lee", "Walker", "Hall", "Allen", "Young", "King",
    "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Carter", "Mitchell", "Perez",
    "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins",
    "Stewart", "Sanchez", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell",
    "Murphy", "Bailey", "Rivera", "Cooper", "Richardson", "Cox", "Howard", "Ward", "Torres",
]

CONDITION_SETS = [
    ["hypertension"],
    ["type 2 diabetes", "hypertension"],
    ["COPD", "hypertension"],
    ["asthma"],
    ["atrial fibrillation", "hypertension"],
    ["CKD", "type 2 diabetes"],
    ["CAD", "hyperlipidemia"],
    ["CHF", "hypertension", "CKD"],
    ["osteoarthritis", "hypertension"],
    ["depression", "anxiety"],
    ["hypothyroidism"],
    ["GERD"],
    ["community-acquired pneumonia risk"],
    ["obesity", "type 2 diabetes"],
    ["stroke history", "hypertension"],
    [],
]

MEDICATION_MAP = {
    "hypertension": ["Lisinopril 10mg", "Amlodipine 5mg", "Hydrochlorothiazide 25mg"],
    "type 2 diabetes": ["Metformin 500mg", "Empagliflozin 10mg"],
    "COPD": ["Albuterol inhaler", "Tiotropium inhaler"],
    "asthma": ["Fluticasone inhaler", "Albuterol inhaler"],
    "atrial fibrillation": ["Apixaban 5mg", "Metoprolol 25mg"],
    "CKD": ["Sodium bicarbonate 650mg"],
    "CAD": ["Aspirin 81mg", "Atorvastatin 40mg"],
    "hyperlipidemia": ["Atorvastatin 20mg"],
    "CHF": ["Furosemide 20mg", "Carvedilol 12.5mg"],
    "osteoarthritis": ["Acetaminophen 500mg"],
    "depression": ["Sertraline 50mg"],
    "anxiety": ["Buspirone 10mg"],
    "hypothyroidism": ["Levothyroxine 75mcg"],
    "GERD": ["Omeprazole 20mg"],
    "obesity": ["Lifestyle counseling"],
    "stroke history": ["Clopidogrel 75mg"],
}

ALLERGY_POOL = [
    [],
    [],
    [],
    ["Penicillin"],
    ["Sulfa"],
    ["Aspirin"],
    ["Codeine"],
    ["Latex"],
    ["Penicillin", "Sulfa"],
    ["Shellfish"],
    ["NKDA"],
]

COMPLAINTS = [
    "Annual physical",
    "URI symptoms",
    "Chest pain",
    "Shortness of breath",
    "Fever and cough",
    "Dysuria",
    "Diabetes follow-up",
    "COPD exacerbation",
    "Palpitations",
    "Abdominal pain",
    "Headache",
    "Back pain",
    "Medication refill",
    "Fall evaluation",
    "Hypertension follow-up",
    "Ankle swelling",
    "Night sweats",
    "Weight loss concern",
]


def _labs_for(conditions: list[str], rng: random.Random) -> dict:
    labs: dict = {
        "WBC": rng.randint(4500, 14500),
        "Hemoglobin": round(rng.uniform(11.0, 16.5), 1),
        "Platelets": rng.randint(150000, 420000),
        "Sodium": rng.randint(133, 145),
        "Potassium": round(rng.uniform(3.4, 5.1), 1),
        "Creatinine": round(rng.uniform(0.7, 2.2), 2),
        "Glucose": rng.randint(85, 210),
    }
    if "type 2 diabetes" in conditions:
        labs["HbA1c"] = round(rng.uniform(6.2, 9.5), 1)
    if "hyperlipidemia" in conditions or "CAD" in conditions:
        labs["LDL"] = rng.randint(70, 180)
        labs["HDL"] = rng.randint(35, 70)
    if "atrial fibrillation" in conditions:
        labs["INR"] = round(rng.uniform(1.0, 2.8), 1)
    if any(c in conditions for c in ("COPD", "community-acquired pneumonia risk", "CHF")):
        labs["CRP"] = round(rng.uniform(2.0, 48.0), 1)
    return labs


def _meds_for(conditions: list[str], rng: random.Random) -> list[str]:
    meds: list[str] = []
    for cond in conditions:
        options = MEDICATION_MAP.get(cond, [])
        if options:
            meds.append(rng.choice(options))
    # dedupe preserve order
    seen: set[str] = set()
    out: list[str] = []
    for m in meds:
        if m not in seen:
            seen.add(m)
            out.append(m)
    return out


def _vitals(conditions: list[str], age: int, gender: str, rng: random.Random) -> dict:
    sys = rng.randint(110, 168) if "hypertension" in conditions else rng.randint(105, 132)
    dia = rng.randint(70, 98) if "hypertension" in conditions else rng.randint(62, 82)
    spo2 = rng.randint(88, 95) if any(c in conditions for c in ("COPD", "CHF")) else rng.randint(95, 99)
    temp = round(rng.uniform(36.4, 38.8), 1) if "community-acquired pneumonia risk" in conditions else round(rng.uniform(36.4, 37.2), 1)
    hr = rng.randint(88, 118) if "atrial fibrillation" in conditions else rng.randint(58, 96)
    height = round(rng.uniform(1.55, 1.72), 2) if gender == "female" else round(rng.uniform(1.68, 1.88), 2)
    weight = round(rng.uniform(52, 110), 1)
    if "obesity" in conditions:
        weight = round(rng.uniform(95, 130), 1)
    return {
        "bp": f"{sys}/{dia}",
        "hr": hr,
        "temp": temp,
        "rr": rng.randint(12, 24),
        "spo2": spo2,
        "weight_kg": weight,
        "height_m": height,
        "pain_score": rng.randint(0, 6),
    }


def _encounters(rng: random.Random, n: int = 3) -> list[dict]:
    years = [2024, 2025, 2026]
    out = []
    for _ in range(rng.randint(1, n)):
        y = rng.choice(years)
        m = rng.randint(1, 12)
        d = rng.randint(1, 28)
        out.append(
            {
                "date": f"{y}-{m:02d}-{d:02d}",
                "complaint": rng.choice(COMPLAINTS),
                "provider": rng.choice(["Dr. Sarah Chen", "Dr. Lee", "Alex Rivera, RN", "Urgent Care"]),
            }
        )
    out.sort(key=lambda e: e["date"], reverse=True)
    return out


def build_mock_patients(count: int = 50, seed: int = 42) -> list[Patient]:
    rng = random.Random(seed)
    patients: list[Patient] = []
    used_names: set[tuple[str, str]] = set()

    for i in range(count):
        gender = "female" if i % 2 == 0 else "male"
        first = rng.choice(FIRST_NAMES_F if gender == "female" else FIRST_NAMES_M)
        last = LAST_NAMES[i % len(LAST_NAMES)]
        # avoid exact duplicates
        attempts = 0
        while (first, last) in used_names and attempts < 20:
            first = rng.choice(FIRST_NAMES_F if gender == "female" else FIRST_NAMES_M)
            last = rng.choice(LAST_NAMES)
            attempts += 1
        used_names.add((first, last))

        age = rng.randint(22, 89)
        conditions = list(rng.choice(CONDITION_SETS))
        # older patients more comorbidity
        if age >= 65 and not conditions:
            conditions = ["hypertension"]
        if age >= 75 and "CKD" not in conditions and rng.random() < 0.35:
            conditions.append("CKD")

        allergies = list(rng.choice(ALLERGY_POOL))
        if allergies == ["NKDA"]:
            allergies = []

        patients.append(
            Patient(
                mrn=f"MRN-{10001 + i}",
                first_name=first,
                last_name=last,
                age=age,
                gender=gender,
                medical_history={
                    "conditions": conditions,
                    "medications": _meds_for(conditions, rng),
                    "labs": _labs_for(conditions, rng),
                    "prior_encounters": _encounters(rng, n=4),
                    "social_history": {
                        "smoking": rng.choice(["never", "former", "current"]),
                        "alcohol": rng.choice(["none", "occasional", "moderate"]),
                        "occupation": rng.choice(
                            ["Retired", "Teacher", "Engineer", "Nurse", "Driver", "Office", "Unemployed"]
                        ),
                    },
                    "family_history": rng.choice(
                        [
                            ["CAD in father"],
                            ["Diabetes in mother"],
                            ["Breast cancer in sister"],
                            ["No significant family history"],
                            ["Stroke in mother", "Hypertension in father"],
                        ]
                    ),
                },
                allergies=allergies,
                vitals=_vitals(conditions, age, gender, rng),
            )
        )
    return patients


async def seed_database() -> None:
    async with async_session() as db:
        demo_users = [
            ("doctor@longcare.ca", "Dr. Sarah Chen", "doctor"),
            ("nurse@longcare.ca", "Alex Rivera, RN", "nurse"),
            ("admin@longcare.ca", "System Admin", "admin"),
        ]
        for email, full_name, role in demo_users:
            existing = await db.execute(select(User).where(User.email == email))
            if not existing.scalar_one_or_none():
                db.add(
                    User(
                        email=email,
                        password_hash=hash_password("demo1234"),
                        full_name=full_name,
                        role=role,
                    )
                )

        count_result = await db.execute(select(func.count()).select_from(Patient))
        existing_count = int(count_result.scalar_one() or 0)

        if existing_count < 50:
            mock = build_mock_patients(50)
            existing_mrns = {
                row[0]
                for row in (await db.execute(select(Patient.mrn))).all()
            }
            to_add = [p for p in mock if p.mrn not in existing_mrns]
            needed = 50 - existing_count
            db.add_all(to_add[:needed])
        else:
            # Enrich older lean records so all 50 have full chart fields
            result = await db.execute(select(Patient))
            for patient in result.scalars().all():
                history = dict(patient.medical_history or {})
                changed = False
                if "social_history" not in history:
                    history["social_history"] = {
                        "smoking": "never",
                        "alcohol": "occasional",
                        "occupation": "Retired" if patient.age >= 65 else "Office",
                    }
                    changed = True
                if "family_history" not in history:
                    history["family_history"] = ["No significant family history"]
                    changed = True
                if "labs" not in history or not history.get("labs"):
                    history["labs"] = {"WBC": 7000, "Creatinine": 1.0, "Glucose": 100}
                    changed = True
                if changed:
                    patient.medical_history = history
                vitals = dict(patient.vitals or {})
                if "hr" not in vitals:
                    vitals["hr"] = 72
                    vitals.setdefault("rr", 16)
                    vitals.setdefault("spo2", 98)
                    patient.vitals = vitals

        await db.commit()
