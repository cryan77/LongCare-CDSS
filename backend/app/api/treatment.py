from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.treatment_agent import run_treatment_agent
from app.database.models import Diagnosis, Patient, Treatment, User
from app.database.session import get_db
from app.models.schemas import ApprovalRequest, TreatmentRequest, TreatmentResponse
from app.security.rbac import require_doctor

router = APIRouter(prefix="/treatment", tags=["treatment"])


@router.post("", response_model=TreatmentResponse)
async def recommend_treatment(
    req: TreatmentRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_doctor),
):
    result = await db.execute(select(Patient).where(Patient.id == req.patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    diagnosis_name = req.diagnosis_name
    diagnosis_id = req.diagnosis_id

    if diagnosis_id:
        dx_result = await db.execute(select(Diagnosis).where(Diagnosis.id == diagnosis_id))
        dx = dx_result.scalar_one_or_none()
        if dx:
            diagnosis_name = dx.disease
            diagnosis_id = dx.id

    if not diagnosis_name:
        raise HTTPException(status_code=400, detail="Diagnosis name or ID required")

    patient_dict = {
        "age": patient.age,
        "gender": patient.gender,
        "allergies": patient.allergies,
        "medical_history": patient.medical_history,
    }
    output = await run_treatment_agent(diagnosis_name, patient_dict)

    treatment_ids: list[int] = []
    if diagnosis_id:
        for med in output["medications"]:
            tx = Treatment(
                diagnosis_id=diagnosis_id,
                drug=med["name"],
                dose=med["dose"],
                frequency=med["frequency"],
                duration=med.get("duration"),
                warnings=output["warnings"],
            )
            db.add(tx)
            await db.flush()
            treatment_ids.append(tx.id)
        await db.commit()

    return TreatmentResponse(id=treatment_ids[0] if treatment_ids else None, **output)


@router.patch("/{treatment_id}/approve")
async def approve_treatment(
    treatment_id: int,
    req: ApprovalRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_doctor),
):
    result = await db.execute(select(Treatment).where(Treatment.id == treatment_id))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Treatment not found")
    tx.approved = req.approved
    await db.commit()
    return {"status": "approved" if req.approved else "rejected", "id": treatment_id}
