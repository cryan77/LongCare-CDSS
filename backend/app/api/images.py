from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.security.rbac import require_doctor
from app.vision.pipeline import analyze_image
from app.database.models import User

router = APIRouter(prefix="/images", tags=["images"])


@router.post("/analyze")
async def analyze_medical_image(
    file: UploadFile = File(...),
    patient_id: int | None = Form(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_doctor),
):
    if file.content_type not in {"image/jpeg", "image/png", "image/jpg"}:
        raise HTTPException(status_code=400, detail="Only JPG/PNG images are supported")

    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    result = await analyze_image(data, filename=file.filename or "image.jpg", patient_id=patient_id)
    return result
