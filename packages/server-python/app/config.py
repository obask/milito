"""Application configuration using pydantic-settings."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = "./dev.db"

    # Client URL for CORS
    client_url: str = "http://localhost:5173"

    # Auth secret (same as Better-Auth)
    better_auth_secret: str = "development-secret-key-minimum-32-chars"

    # Server port
    port: int = 3001

    # Environment
    node_env: str = "development"

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.node_env == "development"

    @property
    def sqlite_url(self) -> str:
        """Get SQLAlchemy-compatible SQLite URL."""
        db_path = self.database_url
        if db_path.startswith("sqlite"):
            return db_path
        # Handle relative and absolute paths
        if db_path.startswith("./"):
            db_path = str(Path(__file__).parent.parent / db_path[2:])
        return f"sqlite:///{db_path}"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
