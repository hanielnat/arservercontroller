from typing import Any, Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm.session import Session

from arservercontroller.core.config import get_config

settings = get_config()

engine = create_engine(settings.DB_URL, **settings.SQLALCHEMY_ENGINE_OPTIONS)


SessionLocal: sessionmaker[Session] = sessionmaker(
    bind=engine, autocommit=False, autoflush=False, expire_on_commit=True
)


def get_db() -> Generator[Session, Any, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
