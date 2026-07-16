from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite+aiosqlite:///./longcare.db"
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # AI provider: openrouter | mock
    llm_provider: str = "openrouter"
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "openai/gpt-4o-mini"
    openrouter_vision_model: str = "openai/gpt-4o"
    openrouter_embedding_model: str = "openai/text-embedding-3-small"

    openai_api_key: str = ""

    vector_backend: str = "memory"
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "guidelines"

    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def use_openrouter(self) -> bool:
        return self.llm_provider.lower() != "mock" and bool(self.openrouter_api_key.strip())


settings = Settings()
