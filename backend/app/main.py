import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, chat, diagnosis, documentation, patient, treatment
from app.config import settings
from app.database.session import init_db
from app.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_database()
    yield


app = FastAPI(
    title="LongCare AI-CDSS",
    description="AI-Powered Clinical Decision Support System",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(patient.router, prefix="/api/v1")
app.include_router(diagnosis.router, prefix="/api/v1")
app.include_router(treatment.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(documentation.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "longcare-cdss"}


@app.get("/api/v1/stats")
async def stats():
    return {
        "agents": ["diagnosis", "treatment", "knowledge", "documentation"],
        "rag_sources": ["WHO", "NICE", "AHA", "ADA", "ESC", "GOLD", "IDSA"],
        "llm_provider": settings.llm_provider,
    }
