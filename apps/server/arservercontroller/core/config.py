import os
from functools import lru_cache
from pathlib import Path
from typing import Self

from pydantic import BaseModel, ConfigDict, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

import arservercontroller
from arservercontroller.constants import (
    DEFAULT_CONTAINER_IMAGE_NAME,
    DEFAULT_TEST_CONTAINER_IMAGE_NAME,
)


class Directories(BaseModel):
    """Base directories for the ARServerController module on the host system."""

    model_config = ConfigDict(frozen=True)

    ROOT_DIR: Path  # ../
    APPS_DIR: Path  # ../apps
    CLIENT_DIST_DIR: Path  # ../apps/web/dist
    DATA_DIR: Path  # ../data
    LOGS_DIR: Path  # ../data/logs

    CONTROLLER_DIR: Path  # ../data/controller
    DS_PROFILES_DIR: Path  # ../data/controller/profiles

    @classmethod
    def create(cls) -> Self:
        root_dir = Path(
            arservercontroller.__file__
        ).parent.parent.parent.parent.resolve()

        apps_dir = root_dir / "apps"
        client_dist_dir = apps_dir / "web" / "dist"
        data_dir = root_dir / "data"
        logs_dir = data_dir / "logs"

        controller_dir = data_dir / "controller"
        ds_profiles_dir = controller_dir / "profiles"

        return cls(
            ROOT_DIR=root_dir,
            APPS_DIR=apps_dir,
            CLIENT_DIST_DIR=client_dist_dir,
            DATA_DIR=data_dir,
            LOGS_DIR=logs_dir,
            CONTROLLER_DIR=controller_dir,
            DS_PROFILES_DIR=ds_profiles_dir,
        )


def get_directories() -> Directories:
    return Directories.create()


class BaseConfig(BaseSettings):
    """Base application configuration class with common settings."""

    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_ignore_empty=True,
        env_file=Path(get_directories().ROOT_DIR / ".env").resolve(),
    )

    ENVIRONMENT: str
    SECRET_KEY: str = Field(default="secretkey")
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    # Application Settings
    VERSION: str = "0.0.1"
    API_V1_STR: str = "/api/v1"

    FRONTEND_DIST_DIR: str = str(get_directories().CLIENT_DIST_DIR)

    # Server Settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Database Settings
    DB_URL: str = f"sqlite:///{get_directories().DATA_DIR}/.db"
    DB_CONNECT_TIMEOUT: int = 30
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

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
    CORS_ORIGINS: list[str]
    CORS_METHODS: list[str] = ["*"]
    CORS_HEADERS: list[str] = ["*"]
    CORS_ALLOW_CREDS: bool = False

    IS_RUNNING_DOCKERIZED: bool = False
    CONTAINER_IMAGE_NAME: str = DEFAULT_CONTAINER_IMAGE_NAME


class DevelopmentConfig(BaseConfig):
    """Development environment configuration."""

    DEBUG: bool = True
    SQLALCHEMY_ECHO: bool = True  # Enable SQL logging in development

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    CONTAINER_IMAGE_NAME: str = DEFAULT_TEST_CONTAINER_IMAGE_NAME


class ProductionConfig(BaseConfig):
    """Production environment configuration."""

    DEBUG: bool = False
    # Override SQLAlchemy engine options for production
    SQLALCHEMY_ENGINE_OPTIONS: dict = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "pool_timeout": 30,
        "max_overflow": 10,
        "connect_args": {"timeout": 30, "check_same_thread": False},
    }

    CORS_ORIGINS: list[str] = ["http://127.0.0.1:8000", "http://localhost:8000"]


class TestingConfig(BaseConfig):
    """Testing environment configuration."""

    DEBUG: bool = True
    TESTING: bool = True

    # Use in-memory database for testing
    DB_URL: str = "sqlite:///:memory:"

    CONTAINER_IMAGE_NAME: str = DEFAULT_TEST_CONTAINER_IMAGE_NAME


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
