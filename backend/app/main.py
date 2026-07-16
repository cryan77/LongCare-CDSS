from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import admin, auth, chat, diagnosis, documentation, images, patient, treatment
from app.config import settings
from app.database.session import init_db
from app.llm.gateway import LLMError
from app.rag.ingest import ingest_guidelines
from app.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_database()
    try:
        await ingest_guidelines()
    except Exception:
        pass
    yield


app = FastAPI(
    title="LongCare AI-CDSS",
    description="AI-Powered Clinical Decision Support System",
    version="2.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(LLMError)
async def llm_error_handler(_: Request, exc: LLMError):
    return JSONResponse(status_code=502, content={"detail": str(exc)})


app.include_router(auth.router, prefix="/api/v1")
app.include_router(patient.router, prefix="/api/v1")
app.include_router(diagnosis.router, prefix="/api/v1")
app.include_router(treatment.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(documentation.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "longcare-cdss",
        "llm_provider": settings.llm_provider,
        "openrouter_configured": settings.use_openrouter,
        "vector_backend": settings.vector_backend,
    }


@app.get("/api/v1/stats")
async def stats():
    return {
        "agents": ["diagnosis", "treatment", "knowledge", "documentation", "safety"],
        "rag_sources": ["WHO", "NICE", "AHA", "ADA", "ESC", "GOLD", "IDSA"],
        "llm_provider": settings.llm_provider,
        "vector_backend": settings.vector_backend,
        "openrouter_configured": settings.use_openrouter,
    }
