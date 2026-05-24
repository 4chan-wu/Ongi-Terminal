from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://ongi:password@localhost:5432/ongi_terminal"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # LLM
    LLM_PROVIDER: str = "claude"  # "claude" or "openai"
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    LLM_MODEL_CLAUDE: str = "claude-sonnet-4-6"
    LLM_MODEL_OPENAI: str = "gpt-4o"
    GEMINI_API_KEY: str = ""
    LLM_MODEL_GEMINI: str = "gemini-2.5-flash"

    # Storage
    STORAGE_BACKEND: str = "local"
    LOCAL_UPLOAD_DIR: str = "./uploads"

    # App
    APP_ENV: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
