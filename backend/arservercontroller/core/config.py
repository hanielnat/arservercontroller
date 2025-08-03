import os
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from arservercontroller.constants import BaseDirectories

_base_directories = BaseDirectories()


class BaseConfig(BaseSettings):
    """Base application configuration class with common settings."""

    model_config = SettingsConfigDict(
        case_sensitive=False, env_file=".env", env_file_encoding="utf-8"
    )

    # Application Settings
    APP_NAME: str = "arservercontroller"
    VERSION: str = "0.0.1"
    API_V1_STR: str = "/api/v1"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database Settings
    DATABASE_DRIVER: str = "aiosqlite"
    DATABASE_NAME: str = "arservercontroller.db"
    DATABASE_CONNECT_TIMEOUT: int = 30
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_PATH: str = Field(
        default=str(_base_directories.DATA_DIR / "db"),
        description="Database file path.",
    )

    @property
    def DATABASE_URL(self) -> str:
        return f"sqlite+{self.DATABASE_DRIVER}:///{self.DATABASE_PATH}/{self.DATABASE_NAME}"

    # SQLAlchemy Settings
    SQLALCHEMY_ECHO: bool = False
    SQLALCHEMY_ENGINE_OPTIONS: dict = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "pool_timeout": 30,
        "max_overflow": 10,
        "connect_args": {
            "timeout": 30,
            "check_same_thread": False,  # Required for SQLite in multi-threaded environments
        },
    }

    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    CORS_METHODS: list[str] = ["*"]
    CORS_HEADERS: list[str] = ["*"]

    # Create required directories
    def create_directories(self):
        """Create necessary directories if they don't exist"""
        for directory in [
            Path(_base_directories.DATA_DIR),
            Path(_base_directories.LOGS_DIR),
            Path(self.DATABASE_PATH),
        ]:
            directory.mkdir(parents=True, exist_ok=True)


class DevelopmentConfig(BaseConfig):
    """Development environment configuration."""

    DEBUG: bool = True
    SQLALCHEMY_ECHO: bool = True  # Enable SQL logging in development
    DATABASE_NAME: str = "arservercontroller_devel.db"


class ProductionConfig(BaseConfig):
    """Production environment configuration."""

    DEBUG: bool = False
    DATABASE_NAME: str = "arservercontroller_prod.db"
    # Override SQLAlchemy engine options for production
    SQLALCHEMY_ENGINE_OPTIONS: dict = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "pool_timeout": 30,
        "max_overflow": 10,
        "connect_args": {"timeout": 30, "check_same_thread": False},
    }


class TestingConfig(BaseConfig):
    """Testing environment configuration."""

    DEBUG: bool = True
    TESTING: bool = True
    DATABASE_NAME: str = "arservercontroller_test.db"
    DATABASE_DRIVER: str = "aiosqlite"

    # Use in-memory database for testing
    @property
    def DATABASE_URL(self) -> str:
        return f"sqlite+{self.DATABASE_DRIVER}:///:memory:"


# Configuration mapping
config_dict: dict[str, type[BaseConfig]] = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


@lru_cache
def get_config() -> BaseConfig:
    """Get the appropriate configuration based on the environment."""
    environment = os.getenv("ENVIRONMENT", "development").lower()

    if environment not in config_dict:
        raise ValueError(f"Invalid environment: {environment}")

    config = config_dict[environment]()
    config.create_directories()
    return config
