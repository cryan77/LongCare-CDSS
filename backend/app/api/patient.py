from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import Encounter, Patient, User
from app.database.session import get_db
from app.models.schemas import (
    EncounterCreate,
    EncounterResponse,
    PatientCreate,
    PatientResponse,
)
from app.security.auth import get_current_user

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[PatientResponse])
async def list_patients(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Patient).order_by(Patient.last_name))
    return result.scalars().all()


@router.post("", response_model=PatientResponse)
async def create_patient(
    patient_in: PatientCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
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
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/encounters", response_model=EncounterResponse)
async def create_encounter(
    encounter_in: EncounterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Encounter).where(Encounter.id == encounter_id))
    encounter = result.scalar_one_or_none()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    return encounter
