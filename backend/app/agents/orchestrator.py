from __future__ import annotations

from typing import Any, TypedDict

from app.agents.diagnosis_agent import run_diagnosis_agent
from app.agents.documentation_agent import run_documentation_agent
from app.agents.knowledge_agent import run_knowledge_agent
from app.agents.treatment_agent import run_treatment_agent


class WorkflowState(TypedDict, total=False):
    patient: dict[str, Any]
    symptoms: list[str]
    labs: dict[str, Any]
    images: list[str]
    encounter: dict[str, Any]
    diagnosis: dict[str, Any]
    treatment: dict[str, Any]
    safety_review: dict[str, Any]
    documentation: dict[str, Any]
    status: str
    error: str


def _validate(state: WorkflowState) -> WorkflowState:
    if not state.get("patient"):
        return {**state, "error": "Patient data required", "status": "failed"}
    return {**state, "status": "validated"}


async def _diagnosis(state: WorkflowState) -> WorkflowState:
    if state.get("error"):
        return state
    diagnosis = await run_diagnosis_agent(
        state["patient"],
        state.get("symptoms", []),
        state.get("labs", {}),
        state.get("images", []),
    )
    return {**state, "diagnosis": diagnosis}


async def _knowledge(state: WorkflowState) -> WorkflowState:
    # Evidence already attached in diagnosis; optional enrichment
    return state


async def _treatment(state: WorkflowState) -> WorkflowState:
    if state.get("error"):
        return state
    dx = state.get("diagnosis") or {}
    dx_name = dx["diagnosis"][0]["name"] if dx.get("diagnosis") else "Unknown"
    treatment = await run_treatment_agent(dx_name, state["patient"])
    return {**state, "treatment": treatment}


def _safety(state: WorkflowState) -> WorkflowState:
    diagnosis = state.get("diagnosis") or {}
    treatment = state.get("treatment") or {}
    safety_review = {
        "passed": len(diagnosis.get("safety_flags", [])) == 0,
        "flags": diagnosis.get("safety_flags", []) + treatment.get("warnings", []),
        "requires_human_review": True,
    }
    return {**state, "safety_review": safety_review}


async def _documentation(state: WorkflowState) -> WorkflowState:
    documentation = await run_documentation_agent(
        "soap",
        state["patient"],
        state.get("encounter", {}),
        state.get("diagnosis"),
        state.get("treatment"),
    )
    return {**state, "documentation": documentation, "status": "pending_physician_approval"}


def _human_gate(state: WorkflowState) -> WorkflowState:
    return {**state, "status": "pending_physician_approval"}


def _build_langgraph():
    try:
        from langgraph.graph import END, StateGraph
    except ImportError:
        return None

    graph = StateGraph(WorkflowState)
    graph.add_node("validate_node", _validate)
    graph.add_node("diagnosis_node", _diagnosis)
    graph.add_node("knowledge_node", _knowledge)
    graph.add_node("treatment_node", _treatment)
    graph.add_node("safety_node", _safety)
    graph.add_node("documentation_node", _documentation)
    graph.add_node("human_gate_node", _human_gate)

    graph.set_entry_point("validate_node")
    graph.add_edge("validate_node", "diagnosis_node")
    graph.add_edge("diagnosis_node", "knowledge_node")
    graph.add_edge("knowledge_node", "treatment_node")
    graph.add_edge("treatment_node", "safety_node")
    graph.add_edge("safety_node", "documentation_node")
    graph.add_edge("documentation_node", "human_gate_node")
    graph.add_edge("human_gate_node", END)
    return graph.compile()


_compiled = None


def get_graph():
    global _compiled
    if _compiled is None:
        _compiled = _build_langgraph()
    return _compiled


class ClinicalOrchestrator:
    """LangGraph multi-agent workflow with sequential fallback."""

    async def run_full_workflow(
        self,
        patient: dict[str, Any],
        symptoms: list[str],
        labs: dict[str, Any],
        images: list[str],
        encounter: dict[str, Any],
    ) -> dict[str, Any]:
        initial: WorkflowState = {
            "patient": patient,
            "symptoms": symptoms,
            "labs": labs,
            "images": images,
            "encounter": encounter,
        }

        graph = get_graph()
        if graph is not None:
            try:
                final = await graph.ainvoke(initial)
                if final.get("error"):
                    raise ValueError(final["error"])
                return {
                    "diagnosis": final["diagnosis"],
                    "treatment": final["treatment"],
                    "safety_review": final["safety_review"],
                    "documentation": final["documentation"],
                    "status": final.get("status", "pending_physician_approval"),
                    "engine": "langgraph",
                }
            except Exception:
                pass

        # Sequential fallback (same nodes)
        state = _validate(initial)
        if state.get("error"):
            raise ValueError(state["error"])
        state = await _diagnosis(state)
        state = await _knowledge(state)
        state = await _treatment(state)
        state = _safety(state)
        state = await _documentation(state)
        state = _human_gate(state)
        return {
            "diagnosis": state["diagnosis"],
            "treatment": state["treatment"],
            "safety_review": state["safety_review"],
            "documentation": state["documentation"],
            "status": state.get("status", "pending_physician_approval"),
            "engine": "sequential",
        }

    async def chat(self, question: str, patient: dict[str, Any] | None = None) -> dict[str, Any]:
        context = ""
        if patient:
            context = f"Patient: {patient.get('age')}yo {patient.get('gender')}, allergies: {patient.get('allergies')}"
        return await run_knowledge_agent(question, context)


orchestrator = ClinicalOrchestrator()
