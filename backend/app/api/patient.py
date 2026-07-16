from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import ClinicalDocument, Diagnosis, Encounter, Patient, User
from app.database.session import get_db
from app.models.schemas import (
    EncounterCreate,
    EncounterResponse,
    NursingNoteCreate,
    PatientCreate,
    PatientResponse,
    VitalsUpdate,
)
from app.security.rbac import require_care_staff, require_clinician, require_doctor

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[PatientResponse])
async def list_patients(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_clinician),
):
    result = await db.execute(select(Patient).order_by(Patient.last_name))
    return result.scalars().all()


@router.post("", response_model=PatientResponse)
async def create_patient(
    patient_in: PatientCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_doctor),
):
    patient = Patient(**patient_in.model_dump())
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_clinician),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.patch("/{patient_id}/vitals", response_model=PatientResponse)
async def update_vitals(
    patient_id: int,
    body: VitalsUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_care_staff),
):
    """Nurse/doctor vitals entry — core nurse workflow per role.md."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    vitals = dict(patient.vitals or {})
    updates = body.model_dump(exclude_none=True)
    notes = updates.pop("notes", None)
    vitals.update(updates)
    from datetime import datetime

    vitals["recorded_at"] = datetime.utcnow().isoformat()
    patient.vitals = vitals

    if notes:
        history = dict(patient.medical_history or {})
        nursing_notes = list(history.get("nursing_notes") or [])
        nursing_notes.insert(
            0,
            {"time": vitals["recorded_at"], "note": notes},
        )
        history["nursing_notes"] = nursing_notes[:20]
        patient.medical_history = history

    await db.commit()
    await db.refresh(patient)
    return patient


@router.post("/{patient_id}/nursing-notes", response_model=PatientResponse)
async def add_nursing_note(
    patient_id: int,
    body: NursingNoteCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_care_staff),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    from datetime import datetime

    history = dict(patient.medical_history or {})
    notes = list(history.get("nursing_notes") or [])
    notes.insert(0, {"time": datetime.utcnow().isoformat(), "note": body.note})
    history["nursing_notes"] = notes[:20]
    patient.medical_history = history
    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("/{patient_id}/timeline")
async def patient_timeline(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_clinician),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    enc_result = await db.execute(
        select(Encounter)
        .where(Encounter.patient_id == patient_id)
        .options(selectinload(Encounter.diagnoses).selectinload(Diagnosis.treatments))
        .order_by(Encounter.date.desc())
    )
    encounters = enc_result.scalars().all()

    events: list[dict] = []
    for enc in encounters:
        events.append(
            {
                "id": f"enc-{enc.id}",
                "type": "encounter",
                "title": f"Encounter #{enc.id}",
                "detail": enc.chief_complaint or "Clinical encounter",
                "date": enc.date.isoformat(),
            }
        )
        for dx in enc.diagnoses:
            events.append(
                {
                    "id": f"dx-{dx.id}",
                    "type": "diagnosis",
                    "title": dx.disease,
                    "detail": f"Confidence {dx.confidence:.0%}. Approved={dx.approved}. {dx.reasoning or ''}",
                    "date": dx.created_at.isoformat(),
                }
            )
            for tx in dx.treatments:
                events.append(
                    {
                        "id": f"tx-{tx.id}",
                        "type": "treatment",
                        "title": f"{tx.drug} {tx.dose}",
                        "detail": f"{tx.frequency} · {tx.duration or '—'} · Approved={tx.approved}",
                        "date": dx.created_at.isoformat(),
                    }
                )

        docs = await db.execute(
            select(ClinicalDocument)
            .where(ClinicalDocument.encounter_id == enc.id)
            .order_by(ClinicalDocument.created_at.desc())
        )
        for doc in docs.scalars().all():
            events.append(
                {
                    "id": f"doc-{doc.id}",
                    "type": "documentation",
                    "title": f"{doc.doc_type.upper()} note",
                    "detail": f"Approved={doc.approved}",
                    "date": doc.created_at.isoformat(),
                }
            )

    events.sort(key=lambda e: e["date"], reverse=True)
    return {"patient_id": patient_id, "events": events}


@router.post("/encounters", response_model=EncounterResponse)
async def create_encounter(
    encounter_in: EncounterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    result = await db.execute(select(Patient).where(Patient.id == encounter_in.patient_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")

    encounter = Encounter(
        patient_id=encounter_in.patient_id,
        doctor_id=current_user.id,
        chief_complaint=encounter_in.chief_complaint,
    )
    db.add(encounter)
    await db.commit()
    await db.refresh(encounter)
    return encounter


@router.get("/encounters/{encounter_id}", response_model=EncounterResponse)
async def get_encounter(
    encounter_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_clinician),
):
    result = await db.execute(select(Encounter).where(Encounter.id == encounter_id))
    encounter = result.scalar_one_or_none()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    return encounter
