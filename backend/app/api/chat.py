from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.orchestrator import orchestrator
from app.database.models import ChatMessage, Patient, User
from app.database.session import get_db
from app.models.schemas import ChatRequest, ChatResponse
from app.security.rbac import require_clinician, require_patient, require_roles

router = APIRouter(prefix="/chat", tags=["chat"])


def _care_alert_reply(message: str, patient: dict | None) -> dict:
    spo2 = None
    if patient and isinstance(patient.get("vitals"), dict):
        spo2 = patient["vitals"].get("spo2")
    low_o2 = spo2 is not None and int(spo2) < 94
    if low_o2 or "oxygen" in message.lower() or "spo2" in message.lower():
        content = (
            "AI Care Alert\n\n"
            "Patient oxygen saturation may need attention based on current vitals.\n\n"
            "Recommendation\n"
            "• Notify the physician.\n"
            "• Monitor SpO₂ every 30 minutes.\n"
            "• Escalate if SpO₂ continues to decline or the patient becomes distressed.\n\n"
            "Nurses cannot approve diagnoses or prescribe medications."
        )
    else:
        content = (
            "Care Assistant\n\n"
            "I can help with vitals trends, medication timing reminders, and when to notify the physician.\n"
            "I cannot provide diagnoses or prescribe treatments.\n\n"
            f"Regarding: “{message[:180]}”\n\n"
            "Recommendation: document observations, recheck vitals as ordered, and escalate clinical concerns to the attending physician."
        )
    return {"content": content, "citations": [{"source": "Nursing protocol", "excerpt": "Escalate deteriorating vitals to physician."}]}


def _patient_edu_reply(message: str) -> dict:
    return {
        "content": (
            "Health Education Assistant\n\n"
            "I can explain general health topics in plain language. "
            "I do not diagnose conditions or recommend prescription medications.\n\n"
            f"About your question: “{message[:200]}”\n\n"
            "Please follow your care team's plan and contact your clinic if symptoms worsen. "
            "For emergencies, seek urgent care immediately."
        ),
        "citations": [{"source": "Patient education", "excerpt": "Educational guidance only — not a diagnosis."}],
    }


@router.post("", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("doctor", "nurse", "patient")),
):
    patient = None
    patient_vitals = None
    if req.patient_id and current_user.role in ("doctor", "nurse"):
        result = await db.execute(select(Patient).where(Patient.id == req.patient_id))
        p = result.scalar_one_or_none()
        if p:
            patient = {
                "age": p.age,
                "gender": p.gender,
                "allergies": p.allergies,
                "vitals": p.vitals,
            }
            patient_vitals = p.vitals

    if current_user.role == "nurse":
        response = _care_alert_reply(req.message, patient)
    elif current_user.role == "patient":
        response = _patient_edu_reply(req.message)
    else:
        response = await orchestrator.chat(req.message, patient)

    user_msg = ChatMessage(
        encounter_id=req.encounter_id,
        user_id=current_user.id,
        role="user",
        content=req.message,
    )
    assistant_msg = ChatMessage(
        encounter_id=req.encounter_id,
        user_id=current_user.id,
        role="assistant",
        content=response["content"],
        citations=response["citations"],
    )
    db.add(user_msg)
    db.add(assistant_msg)
    await db.commit()

    return ChatResponse(
        role="assistant",
        content=response["content"],
        citations=response["citations"],
    )


@router.get("/history")
async def chat_history(
    encounter_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_clinician),
):
    query = select(ChatMessage).order_by(ChatMessage.created_at)
    if encounter_id:
        query = query.where(ChatMessage.encounter_id == encounter_id)
    result = await db.execute(query.limit(50))
    messages = result.scalars().all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "citations": m.citations,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


@router.post("/patient-edu", response_model=ChatResponse)
async def patient_education_chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    response = _patient_edu_reply(req.message)
    db.add(
        ChatMessage(
            user_id=current_user.id,
            role="user",
            content=req.message,
        )
    )
    db.add(
        ChatMessage(
            user_id=current_user.id,
            role="assistant",
            content=response["content"],
            citations=response["citations"],
        )
    )
    await db.commit()
    return ChatResponse(role="assistant", content=response["content"], citations=response["citations"])
