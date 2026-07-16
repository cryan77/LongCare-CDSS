from __future__ import annotations

from typing import Any

from app.agents.diagnosis_agent import run_diagnosis_agent
from app.agents.documentation_agent import run_documentation_agent
from app.agents.knowledge_agent import run_knowledge_agent
from app.agents.treatment_agent import run_treatment_agent


class ClinicalOrchestrator:
    """LangGraph-style multi-agent workflow (sequential pipeline)."""

    async def run_full_workflow(
        self,
        patient: dict[str, Any],
        symptoms: list[str],
        labs: dict[str, Any],
        images: list[str],
        encounter: dict[str, Any],
    ) -> dict[str, Any]:
        # Step 1: Patient data validation
        if not patient:
            raise ValueError("Patient data required")

        # Step 2: Diagnosis Agent
        diagnosis = run_diagnosis_agent(patient, symptoms, labs, images)

        # Step 3: Knowledge Retrieval (evidence already in diagnosis)
        dx_name = diagnosis["diagnosis"][0]["name"] if diagnosis["diagnosis"] else "Unknown"

        # Step 4: Treatment Agent
        treatment = run_treatment_agent(dx_name, patient)

        # Step 5: Safety Agent
        safety_review = {
            "passed": len(diagnosis.get("safety_flags", [])) == 0,
            "flags": diagnosis.get("safety_flags", []) + treatment.get("warnings", []),
            "requires_human_review": True,
        }

        # Step 6: Documentation Agent
        documentation = run_documentation_agent("soap", patient, encounter, diagnosis, treatment)

        return {
            "diagnosis": diagnosis,
            "treatment": treatment,
            "safety_review": safety_review,
            "documentation": documentation,
            "status": "pending_physician_approval",
        }

    async def chat(self, question: str, patient: dict[str, Any] | None = None) -> dict[str, Any]:
        context = ""
        if patient:
            context = f"Patient: {patient.get('age')}yo {patient.get('gender')}, allergies: {patient.get('allergies')}"
        return await run_knowledge_agent(question, context)


orchestrator = ClinicalOrchestrator()
