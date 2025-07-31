from typing import Any, Generator
from sqlalchemy import Engine, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm.session import Session
from arservercontroller.main import settings

engine: Engine = create_engine(
    settings.DATABASE_URL, **settings.SQLALCHEMY_ENGINE_OPTIONS
)

# Create session factory
SessionLocal: sessionmaker[Session] = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, expire_on_commit=False
)

# Create base class for models
Base: Any = declarative_base()


# Dependency to get database session
def get_db() -> Generator[Session, Any, None]:
    """Get database session for dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
