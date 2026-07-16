from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.diagnosis_agent import run_diagnosis_agent
from app.agents.orchestrator import orchestrator
from app.database.models import ClinicalDocument, Diagnosis, Encounter, Patient, Treatment, User
from app.database.session import get_db
from app.models.schemas import ApprovalRequest, DiagnosisRequest, DiagnosisResponse
from app.security.rbac import require_doctor

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


async def _resolve_encounter(
    db: AsyncSession,
    patient: Patient,
    current_user: User,
    encounter_id: int | None,
    symptoms: list[str],
) -> int:
    if encounter_id:
        enc_result = await db.execute(select(Encounter).where(Encounter.id == encounter_id))
        enc = enc_result.scalar_one_or_none()
        if not enc or enc.patient_id != patient.id:
            raise HTTPException(status_code=404, detail="Encounter not found for patient")
        return enc.id

    enc = Encounter(
        patient_id=patient.id,
        doctor_id=current_user.id,
        chief_complaint=", ".join(symptoms) or "Clinical encounter",
    )
    db.add(enc)
    await db.flush()
    return enc.id


@router.post("", response_model=DiagnosisResponse)
async def create_diagnosis(
    req: DiagnosisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    result = await db.execute(select(Patient).where(Patient.id == req.patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    output = await run_diagnosis_agent(_patient_dict(patient), req.symptoms, req.labs, req.images)
    encounter_id = await _resolve_encounter(db, patient, current_user, req.encounter_id, req.symptoms)

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

    return DiagnosisResponse(id=dx.id, encounter_id=encounter_id, **output)


@router.post("/workflow")
async def run_workflow(
    req: DiagnosisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    result = await db.execute(select(Patient).where(Patient.id == req.patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    encounter_id = await _resolve_encounter(db, patient, current_user, req.encounter_id, req.symptoms)
    encounter_dict = {"id": encounter_id, "chief_complaint": ", ".join(req.symptoms) or "Clinical encounter"}
    patient_dict = _patient_dict(patient)

    workflow = await orchestrator.run_full_workflow(
        patient_dict, req.symptoms, req.labs, req.images, encounter_dict
    )

    diagnosis = workflow["diagnosis"]
    treatment = workflow["treatment"]
    documentation = workflow["documentation"]

    dx = Diagnosis(
        encounter_id=encounter_id,
        disease=diagnosis["diagnosis"][0]["name"],
        confidence=diagnosis["confidence"],
        reasoning=diagnosis["reasoning"],
        differential=diagnosis["differential"],
        evidence=diagnosis["evidence"],
    )
    db.add(dx)
    await db.flush()

    treatment_ids: list[int] = []
    for med in treatment.get("medications", []):
        tx = Treatment(
            diagnosis_id=dx.id,
            drug=med["name"],
            dose=med["dose"],
            frequency=med["frequency"],
            duration=med.get("duration"),
            warnings=treatment.get("warnings", []),
        )
        db.add(tx)
        await db.flush()
        treatment_ids.append(tx.id)

    doc = ClinicalDocument(
        encounter_id=encounter_id,
        doc_type="soap",
        content=documentation,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    steps = [
        {"name": "validation", "status": "completed", "detail": "Patient data validated"},
        {"name": "diagnosis", "status": "completed", "id": dx.id},
        {"name": "knowledge", "status": "completed", "detail": f"{len(diagnosis.get('evidence', []))} citations"},
        {"name": "treatment", "status": "completed", "ids": treatment_ids},
        {"name": "safety", "status": "completed", "detail": workflow["safety_review"]},
        {"name": "documentation", "status": "completed", "id": doc.id},
        {"name": "human_review", "status": "pending"},
    ]

    return {
        "encounter_id": encounter_id,
        "diagnosis_id": dx.id,
        "treatment_ids": treatment_ids,
        "document_id": doc.id,
        "steps": steps,
        "diagnosis": {**diagnosis, "id": dx.id, "encounter_id": encounter_id},
        "treatment": {**treatment, "ids": treatment_ids},
        "safety_review": workflow["safety_review"],
        "documentation": {"id": doc.id, "doc_type": "soap", "content": documentation, "approved": False},
        "status": "pending_physician_approval",
        "engine": workflow.get("engine", "sequential"),
    }


@router.patch("/{diagnosis_id}/approve")
async def approve_diagnosis(
    diagnosis_id: int,
    req: ApprovalRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_doctor),
):
    result = await db.execute(select(Diagnosis).where(Diagnosis.id == diagnosis_id))
    dx = result.scalar_one_or_none()
    if not dx:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    dx.approved = req.approved
    if req.edits and "reasoning" in req.edits:
        dx.reasoning = req.edits["reasoning"]
    if req.edits and "disease" in req.edits:
        dx.disease = req.edits["disease"]
    await db.commit()
    return {"status": "approved" if req.approved else "rejected", "id": diagnosis_id}
