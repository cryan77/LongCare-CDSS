from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.documentation_agent import run_documentation_agent
from app.database.models import ClinicalDocument, Diagnosis, Encounter, Patient, User
from app.database.session import get_db
from app.models.schemas import ApprovalRequest, DocumentationRequest, DocumentationResponse
from app.security.rbac import require_doctor

router = APIRouter(prefix="/documentation", tags=["documentation"])


@router.post("", response_model=DocumentationResponse)
async def generate_documentation(
    req: DocumentationRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_doctor),
):
    enc_result = await db.execute(select(Encounter).where(Encounter.id == req.encounter_id))
    encounter = enc_result.scalar_one_or_none()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    pat_result = await db.execute(select(Patient).where(Patient.id == encounter.patient_id))
    patient = pat_result.scalar_one()

    dx_result = await db.execute(
        select(Diagnosis)
        .where(Diagnosis.encounter_id == encounter.id)
        .order_by(Diagnosis.created_at.desc())
    )
    diagnosis_row = dx_result.scalars().first()
    diagnosis = None
    if diagnosis_row:
        diagnosis = {
            "diagnosis": [{"name": diagnosis_row.disease}],
            "reasoning": diagnosis_row.reasoning,
        }

    patient_dict = {
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "vitals": patient.vitals,
    }
    encounter_dict = {"chief_complaint": encounter.chief_complaint}
    content = await run_documentation_agent(req.doc_type, patient_dict, encounter_dict, diagnosis)

    doc = ClinicalDocument(
        encounter_id=encounter.id,
        doc_type=req.doc_type,
        content=content,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    return DocumentationResponse(id=doc.id, doc_type=req.doc_type, content=content)


@router.patch("/{doc_id}/approve")
async def approve_document(
    doc_id: int,
    req: ApprovalRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_doctor),
):
    result = await db.execute(select(ClinicalDocument).where(ClinicalDocument.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.approved = req.approved
    if req.edits:
        doc.content = {**doc.content, **req.edits}
    await db.commit()
    return {"status": "approved" if req.approved else "rejected", "id": doc_id}


@router.get("/{doc_id}/pdf")
async def download_pdf(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_doctor),
):
    result = await db.execute(select(ClinicalDocument).where(ClinicalDocument.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
    except ImportError as exc:
        raise HTTPException(status_code=500, detail="reportlab not installed") from exc

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, f"LongCare CDSS — {doc.doc_type.upper()} Document #{doc.id}")
    y -= 30
    c.setFont("Helvetica", 11)
    for key, value in (doc.content or {}).items():
        if y < 80:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 11)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(50, y, str(key).upper())
        y -= 16
        c.setFont("Helvetica", 10)
        text = str(value)
        while text:
            line = text[:95]
            text = text[95:]
            if y < 60:
                c.showPage()
                y = height - 50
            c.drawString(50, y, line)
            y -= 14
        y -= 10
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(50, 40, "For physician review — AI-assisted decision support only.")
    c.save()
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="clinical-doc-{doc_id}.pdf"'},
    )
