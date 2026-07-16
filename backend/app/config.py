from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./longcare.db"
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # AI provider: mock | openrouter
    llm_provider: str = "mock"
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "openai/gpt-4o-mini"
    openrouter_vision_model: str = "openai/gpt-4o"
    openrouter_embedding_model: str = "openai/text-embedding-3-small"

    # Legacy alias (ignored if openrouter set)
    openai_api_key: str = ""

    # Vector store: memory | qdrant
    vector_backend: str = "memory"
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "guidelines"

    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def use_openrouter(self) -> bool:
        return self.llm_provider == "openrouter" and bool(self.openrouter_api_key)

    class Config:
        env_file = ".env"


settings = Settings()
