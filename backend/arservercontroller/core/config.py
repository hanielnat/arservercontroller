import os
from functools import lru_cache

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

from arservercontroller.constants import directory_manager


class BaseConfig(BaseSettings):
    """Base application configuration class with common settings."""

    model_config = SettingsConfigDict(
        case_sensitive=False, env_file=".env", env_file_encoding="utf-8"
    )

    SECRET_KEY: str = Field(default="secretkey")
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    # Application Settings
    VERSION: str = "0.0.1"
    API_V1_STR: str = "/api/v1"

    SERVE_STATIC: bool = False
    SERVE_STATIC_DIR: str = str(
        directory_manager.base_directories.ROOT_DIR.parent.resolve()
        / "frontend/.output/public"
    )

    # Server Settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Database Settings
    DB_NAME: str = "arservercontroller.db"
    DB_CONNECT_TIMEOUT: int = 30
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    @computed_field
    @property
    def DB_URL(self) -> str:
        return f"sqlite:///{directory_manager.base_directories.DB_DIR}/{self.DB_NAME}"

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
    CORS_ALLOW_CREDS: bool = False


class DevelopmentConfig(BaseConfig):
    """Development environment configuration."""

    DEBUG: bool = True
    SQLALCHEMY_ECHO: bool = True  # Enable SQL logging in development
    DB_NAME: str = "arservercontroller_devel.db"


class ProductionConfig(BaseConfig):
    """Production environment configuration."""

    DEBUG: bool = False
    DB_NAME: str = "arservercontroller_prod.db"
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
    DB_NAME: str = "arservercontroller_test.db"

    # Use in-memory database for testing
    @computed_field
    @property
    def DB_URL(self) -> str:
        return "sqlite:///:memory:"


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
    return config


settings = get_config()
