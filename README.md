# LongCare AI-CDSS

AI-Powered Clinical Decision Support System — multi-agent clinical workflow with optional OpenRouter LLM, RAG, Vision, and LangGraph orchestration.

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open http://127.0.0.1:5173

### Demo logins

| Role | Email | Password |
|------|-------|----------|
| Doctor | doctor@longcare.ca | demo1234 |
| Nurse | nurse@longcare.ca | demo1234 |
| Admin | admin@longcare.ca | demo1234 |

## Features

- Amplify Care–style CDS landing page
- **Run CDSS** full workflow (validation → diagnosis → knowledge → treatment → safety → docs)
- Patient registry + **medical timeline**
- Diagnosis / treatment / documentation with **approve / reject / edit**
- Knowledge chat with RAG citations
- **Imaging** JPG/PNG analyze (mock or OpenRouter vision)
- **PDF export** for clinical documents
- RBAC (doctor / nurse / admin)
- Alembic migrations + Postgres/Qdrant via docker-compose

## OpenRouter (required for live AI)

In `backend/.env`:

```
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_VISION_MODEL=openai/gpt-4o
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small
```

Restart the backend after changing `.env`. Mock mode is only used if you explicitly set `LLM_PROVIDER=mock`.

## Vector store

```
VECTOR_BACKEND=memory   # default
VECTOR_BACKEND=qdrant   # requires Qdrant
QDRANT_URL=http://localhost:6333
```

```bash
docker compose up -d postgres qdrant
```

## API docs

http://127.0.0.1:8000/docs

## Disclaimer

Demonstration platform only. AI outputs require physician review and do not replace clinical judgment.
