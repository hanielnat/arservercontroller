import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseConfig(BaseSettings):
    """
    Base application configuration class with common settings.
    """

    # Application Settings
    APP_NAME: str = "AR Server Controller"
    VERSION: str = "0.0.1"
    API_V1_STR: str = "/api/v1"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database Settings
    DATABASE_URL: str = Field(
        default="sqlite:///./arservercontroller.db",
        description="Database connection URL",
    )
    DATABASE_CONNECT_TIMEOUT: int = 30
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

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

    # Create required directories
    def create_directories(self):
        """Create necessary directories if they don't exist"""
        from arservercontroller.constants import BaseDirectories

        for directory in [BaseDirectories.DATA_DIR, BaseDirectories.LOGS_DIR]:
            directory.mkdir(parents=True, exist_ok=True)

    model_config = SettingsConfigDict(
        case_sensitive=True, env_file=".env", env_file_encoding="utf-8"
    )


class DevelopmentConfig(BaseConfig):
    """
    Development environment configuration.
    """

    DEBUG: bool = True
    SQLALCHEMY_ECHO: bool = True  # Enable SQL logging in development
    DATABASE_URL: str = Field(
        default="sqlite:///./arservercontroller_dev.db",
        description="Development database URL",
    )


class ProductionConfig(BaseConfig):
    """
    Production environment configuration.
    """

    DEBUG: bool = False
    DATABASE_URL: str = Field(
        default="sqlite:///./arservercontroller.db",
        description="Production database URL",
    )
    # Override SQLAlchemy engine options for production
    SQLALCHEMY_ENGINE_OPTIONS: dict = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "pool_timeout": 30,
        "max_overflow": 10,
        "connect_args": {"timeout": 30, "check_same_thread": False},
    }


class TestingConfig(BaseConfig):
    """
    Testing environment configuration.
    """

    DEBUG: bool = True
    TESTING: bool = True
    DATABASE_URL: str = Field(
        default="sqlite:///./arservercontroller_test.db",
        description="Testing database URL",
    )
    # Use in-memory database for testing if desired
    # DATABASE_URL: str = "sqlite:///:memory:"


# Configuration mapping
config_dict: dict[str, type[BaseConfig]] = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


# Get current environment (default to development)
def get_config() -> BaseConfig:
    """
    Get the appropriate configuration based on the environment.
    """
    environment = os.getenv("ENVIRONMENT", "development").lower()

    if environment not in config_dict:
        raise ValueError(f"Invalid environment: {environment}")

    config = config_dict[environment]()
    config.create_directories()
    return config
