from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="doctor")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    mrn: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    age: Mapped[int] = mapped_column(Integer)
    gender: Mapped[str] = mapped_column(String(20))
    medical_history: Mapped[dict | None] = mapped_column(JSON, default=dict)
    allergies: Mapped[list | None] = mapped_column(JSON, default=list)
    vitals: Mapped[dict | None] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    encounters: Mapped[list["Encounter"]] = relationship(back_populates="patient")


class Encounter(Base):
    __tablename__ = "encounters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    chief_complaint: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="active")

    patient: Mapped["Patient"] = relationship(back_populates="encounters")
    diagnoses: Mapped[list["Diagnosis"]] = relationship(back_populates="encounter")
    chat_messages: Mapped[list["ChatMessage"]] = relationship(back_populates="encounter")


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    encounter_id: Mapped[int] = mapped_column(ForeignKey("encounters.id"))
    disease: Mapped[str] = mapped_column(String(255))
    confidence: Mapped[float] = mapped_column(Float)
    reasoning: Mapped[str | None] = mapped_column(Text)
    differential: Mapped[list | None] = mapped_column(JSON, default=list)
    evidence: Mapped[list | None] = mapped_column(JSON, default=list)
    approved: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    encounter: Mapped["Encounter"] = relationship(back_populates="diagnoses")
    treatments: Mapped[list["Treatment"]] = relationship(back_populates="diagnosis")


class Treatment(Base):
    __tablename__ = "treatments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    diagnosis_id: Mapped[int] = mapped_column(ForeignKey("diagnoses.id"))
    drug: Mapped[str] = mapped_column(String(255))
    dose: Mapped[str] = mapped_column(String(100))
    frequency: Mapped[str] = mapped_column(String(100))
    duration: Mapped[str | None] = mapped_column(String(100))
    warnings: Mapped[list | None] = mapped_column(JSON, default=list)
    approved: Mapped[bool] = mapped_column(default=False)

    diagnosis: Mapped["Diagnosis"] = relationship(back_populates="treatments")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    encounter_id: Mapped[int | None] = mapped_column(ForeignKey("encounters.id"), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    citations: Mapped[list | None] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    encounter: Mapped["Encounter | None"] = relationship(back_populates="chat_messages")


class ClinicalDocument(Base):
    __tablename__ = "clinical_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    encounter_id: Mapped[int] = mapped_column(ForeignKey("encounters.id"))
    doc_type: Mapped[str] = mapped_column(String(50))
    content: Mapped[dict] = mapped_column(JSON)
    approved: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
