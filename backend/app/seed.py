from sqlalchemy import select

from app.database.models import Patient, User
from app.database.session import async_session
from app.security.auth import hash_password


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

        patient_result = await db.execute(select(Patient).limit(1))
        if not patient_result.scalar_one_or_none():
            patients = [
                Patient(
                    mrn="MRN-10001",
                    first_name="James",
                    last_name="Morrison",
                    age=55,
                    gender="male",
                    medical_history={
                        "conditions": ["hypertension"],
                        "medications": ["Lisinopril 10mg"],
                        "labs": {"WBC": 12000, "Creatinine": 1.1, "HbA1c": 5.6},
                        "prior_encounters": [
                            {"date": "2025-11-02", "complaint": "Annual physical"},
                            {"date": "2026-03-14", "complaint": "URI symptoms"},
                        ],
                    },
                    allergies=["Penicillin"],
                    vitals={
                        "bp": "142/88",
                        "hr": 88,
                        "temp": 38.4,
                        "rr": 20,
                        "spo2": 94,
                        "weight_kg": 82,
                        "height_m": 1.78,
                    },
                ),
                Patient(
                    mrn="MRN-10002",
                    first_name="Emily",
                    last_name="Nguyen",
                    age=34,
                    gender="female",
                    medical_history={
                        "conditions": [],
                        "medications": [],
                        "labs": {"WBC": 7200},
                        "prior_encounters": [{"date": "2026-01-20", "complaint": "Dysuria"}],
                    },
                    allergies=[],
                    vitals={
                        "bp": "118/72",
                        "hr": 72,
                        "temp": 37.1,
                        "rr": 14,
                        "spo2": 99,
                        "weight_kg": 62,
                        "height_m": 1.65,
                    },
                ),
                Patient(
                    mrn="MRN-10003",
                    first_name="Robert",
                    last_name="Patel",
                    age=68,
                    gender="male",
                    medical_history={
                        "conditions": ["type 2 diabetes", "COPD", "CKD"],
                        "medications": ["Metformin 500mg", "Albuterol inhaler"],
                        "labs": {"HbA1c": 7.8, "Creatinine": 1.6, "WBC": 9100},
                        "prior_encounters": [
                            {"date": "2025-09-10", "complaint": "COPD exacerbation"},
                            {"date": "2026-02-01", "complaint": "Diabetes follow-up"},
                        ],
                    },
                    allergies=["Sulfa"],
                    vitals={
                        "bp": "130/80",
                        "hr": 76,
                        "temp": 36.8,
                        "rr": 18,
                        "spo2": 93,
                        "weight_kg": 90,
                        "height_m": 1.75,
                    },
                ),
                Patient(
                    mrn="MRN-10004",
                    first_name="Maria",
                    last_name="Santos",
                    age=72,
                    gender="female",
                    medical_history={
                        "conditions": ["atrial fibrillation", "hypertension"],
                        "medications": ["Apixaban 5mg", "Amlodipine 5mg"],
                        "labs": {"INR": 1.1, "WBC": 6500},
                        "prior_encounters": [{"date": "2026-04-05", "complaint": "Palpitations"}],
                    },
                    allergies=[],
                    vitals={
                        "bp": "138/82",
                        "hr": 96,
                        "temp": 36.6,
                        "rr": 16,
                        "spo2": 97,
                        "weight_kg": 70,
                        "height_m": 1.60,
                    },
                ),
            ]
            db.add_all(patients)

        await db.commit()
