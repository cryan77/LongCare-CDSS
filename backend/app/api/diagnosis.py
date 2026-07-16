from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.diagnosis_agent import run_diagnosis_agent
from app.agents.orchestrator import orchestrator
from app.database.models import Diagnosis, Encounter, Patient, User
from app.database.session import get_db
from app.models.schemas import ApprovalRequest, DiagnosisRequest, DiagnosisResponse
from app.security.auth import get_current_user

router = APIRouter(prefix="/diagnosis", tags=["diagnosis"])


def _patient_dict(p: Patient) -> dict:
    return {
        "id": p.id,
        "age": p.age,
        "gender": p.gender,
        "allergies": p.allergies,
        "vitals": p.vitals,
        "medical_history": p.medical_history,
        "first_name": p.first_name,
        "last_name": p.last_name,
    }


@router.post("", response_model=DiagnosisResponse)
async def create_diagnosis(
    req: DiagnosisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Patient).where(Patient.id == req.patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    output = run_diagnosis_agent(_patient_dict(patient), req.symptoms, req.labs, req.images)

    encounter_id = req.encounter_id
    if not encounter_id:
        enc = Encounter(patient_id=patient.id, doctor_id=current_user.id, chief_complaint=", ".join(req.symptoms))
        db.add(enc)
        await db.flush()
        encounter_id = enc.id

    dx = Diagnosis(
        encounter_id=encounter_id,
        disease=output["diagnosis"][0]["name"],
        confidence=output["confidence"],
        reasoning=output["reasoning"],
        differential=output["differential"],
        evidence=output["evidence"],
    )
    db.add(dx)
    await db.commit()
    await db.refresh(dx)

    return DiagnosisResponse(id=dx.id, **output)


@router.post("/workflow")
async def run_workflow(
    req: DiagnosisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Patient).where(Patient.id == req.patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    encounter_id = req.encounter_id
    if not encounter_id:
        enc = Encounter(
            patient_id=patient.id,
            doctor_id=current_user.id,
            chief_complaint=", ".join(req.symptoms),
        )
        db.add(enc)
        await db.flush()
        encounter_id = enc.id
    else:
        enc_result = await db.execute(select(Encounter).where(Encounter.id == encounter_id))
        enc = enc_result.scalar_one()
        encounter_id = enc.id

    encounter_dict = {"id": encounter_id, "chief_complaint": ", ".join(req.symptoms)}
    workflow = await orchestrator.run_full_workflow(
        _patient_dict(patient), req.symptoms, req.labs, req.images, encounter_dict
    )
    return {"encounter_id": encounter_id, **workflow}


@router.patch("/{diagnosis_id}/approve")
async def approve_diagnosis(
    diagnosis_id: int,
    req: ApprovalRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Diagnosis).where(Diagnosis.id == diagnosis_id))
    dx = result.scalar_one_or_none()
    if not dx:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    dx.approved = req.approved
    if req.edits and "reasoning" in req.edits:
        dx.reasoning = req.edits["reasoning"]
    await db.commit()
    return {"status": "approved" if req.approved else "rejected", "id": diagnosis_id}
