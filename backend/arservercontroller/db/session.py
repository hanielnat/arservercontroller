from typing import Any, Generator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from arservercontroller.main import settings

engine: Engine = create_engine(
    settings.DATABASE_URL, **settings.SQLALCHEMY_ENGINE_OPTIONS
)

SessionLocal: sessionmaker[Session] = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, expire_on_commit=False
)


def get_db() -> Generator[Session, Any, None]:
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
