# LongCare AI-CDSS

AI-Powered Clinical Decision Support System — an enterprise multi-agent healthcare platform for clinician assistance using LLMs, RAG, and workflow orchestration.

## Architecture

- **Frontend:** React 19, TypeScript, Vite, Material UI
- **Backend:** Python 3.12, FastAPI, SQLAlchemy, multi-agent orchestration
- **AI:** Diagnosis, Treatment, Knowledge (RAG), and Documentation agents
- **Data:** SQLite (dev), guideline knowledge base with hybrid retrieval

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
pip install email-validator
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Demo Login

- **Email:** `doctor@longcare.ca`
- **Password:** `demo1234`

## Features

| Module | Description |
|--------|-------------|
| Landing Page | Amplify Care–inspired CDS education and evaluation guide |
| Patient Registry | Demographics, allergies, vitals |
| Diagnosis Agent | Symptom-based reasoning, differential, RAG evidence |
| Treatment Agent | Guideline-aligned meds, allergy & interaction checks |
| Knowledge Chat | RAG Q&A with citations (WHO, NICE, AHA, etc.) |
| Documentation | SOAP notes and discharge summaries |
| Physician Approval | Human-in-the-loop workflow for all AI outputs |

## API

- `POST /api/v1/auth/login` — OAuth2 login
- `GET /api/v1/patients` — List patients
- `POST /api/v1/diagnosis` — Run diagnosis agent
- `POST /api/v1/treatment` — Treatment recommendations
- `POST /api/v1/chat` — Medical knowledge Q&A
- `POST /api/v1/documentation` — Generate clinical docs

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Optional: OpenAI Integration

Set in `backend/.env`:

```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

## Disclaimer

This is a demonstration platform. AI outputs require physician review and do not replace clinical judgment.
