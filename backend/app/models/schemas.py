from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    role: str = "doctor"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True


class PatientCreate(BaseModel):
    mrn: str
    first_name: str
    last_name: str
    age: int
    gender: str
    medical_history: dict[str, Any] = {}
    allergies: list[str] = []
    vitals: dict[str, Any] = {}


class PatientResponse(BaseModel):
    id: int
    mrn: str
    first_name: str
    last_name: str
    age: int
    gender: str
    medical_history: dict[str, Any]
    allergies: list[str]
    vitals: dict[str, Any]

    class Config:
        from_attributes = True


class EncounterCreate(BaseModel):
    patient_id: int
    chief_complaint: str = ""


class EncounterResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    date: datetime
    chief_complaint: str | None
    status: str

    class Config:
        from_attributes = True


class DiagnosisRequest(BaseModel):
    patient_id: int
    encounter_id: int | None = None
    symptoms: list[str] = []
    labs: dict[str, Any] = {}
    images: list[str] = []


class DiagnosisItem(BaseModel):
    name: str
    probability: float


class DiagnosisResponse(BaseModel):
    id: int | None = None
    diagnosis: list[DiagnosisItem]
    differential: list[str]
    reasoning: str
    evidence: list[dict[str, Any]]
    confidence: float
    safety_flags: list[str] = []


class TreatmentRequest(BaseModel):
    diagnosis_id: int | None = None
    diagnosis_name: str = ""
    patient_id: int
    symptoms: list[str] = []


class MedicationItem(BaseModel):
    name: str
    dose: str
    frequency: str
    duration: str | None = None


class TreatmentResponse(BaseModel):
    id: int | None = None
    medications: list[MedicationItem]
    warnings: list[str]
    guidelines: list[dict[str, Any]] = []
    safety_checks: dict[str, Any] = {}


class ChatRequest(BaseModel):
    message: str
    encounter_id: int | None = None
    patient_id: int | None = None


class ChatResponse(BaseModel):
    role: str
    content: str
    citations: list[dict[str, Any]] = []


class DocumentationRequest(BaseModel):
    encounter_id: int
    doc_type: str = "soap"


class DocumentationResponse(BaseModel):
    id: int | None = None
    doc_type: str
    content: dict[str, Any]
    approved: bool = False


class ApprovalRequest(BaseModel):
    approved: bool = True
    edits: dict[str, Any] | None = None
