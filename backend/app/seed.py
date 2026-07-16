from sqlalchemy import select

from app.database.models import Patient, User
from app.database.session import async_session
from app.security.auth import hash_password


async def seed_database() -> None:
    async with async_session() as db:
        user_result = await db.execute(select(User).where(User.email == "doctor@longcare.ca"))
        if not user_result.scalar_one_or_none():
            doctor = User(
                email="doctor@longcare.ca",
                password_hash=hash_password("demo1234"),
                full_name="Dr. Sarah Chen",
                role="doctor",
            )
            db.add(doctor)

        patient_result = await db.execute(select(Patient).limit(1))
        if not patient_result.scalar_one_or_none():
            patients = [
                Patient(
                    mrn="MRN-10001",
                    first_name="James",
                    last_name="Morrison",
                    age=55,
                    gender="male",
                    medical_history={"conditions": ["hypertension"], "medications": ["Lisinopril 10mg"]},
                    allergies=["Penicillin"],
                    vitals={"bp": "142/88", "hr": 88, "temp": 38.4, "weight_kg": 82, "height_m": 1.78},
                ),
                Patient(
                    mrn="MRN-10002",
                    first_name="Emily",
                    last_name="Nguyen",
                    age=34,
                    gender="female",
                    medical_history={"conditions": []},
                    allergies=[],
                    vitals={"bp": "118/72", "hr": 72, "temp": 37.1, "weight_kg": 62, "height_m": 1.65},
                ),
                Patient(
                    mrn="MRN-10003",
                    first_name="Robert",
                    last_name="Patel",
                    age=68,
                    gender="male",
                    medical_history={"conditions": ["type 2 diabetes", "COPD"]},
                    allergies=["Sulfa"],
                    vitals={"bp": "130/80", "hr": 76, "temp": 36.8, "weight_kg": 90, "height_m": 1.75},
                ),
            ]
            db.add_all(patients)

        await db.commit()
