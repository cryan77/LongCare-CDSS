from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.orchestrator import orchestrator
from app.database.models import ChatMessage, Patient, User
from app.database.session import get_db
from app.models.schemas import ChatRequest, ChatResponse
from app.security.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = None
    if req.patient_id:
        result = await db.execute(select(Patient).where(Patient.id == req.patient_id))
        p = result.scalar_one_or_none()
        if p:
            patient = {
                "age": p.age,
                "gender": p.gender,
                "allergies": p.allergies,
            }

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
    _: User = Depends(get_current_user),
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
