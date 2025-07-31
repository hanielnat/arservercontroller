from logging import Logger
from typing import Any, Generator
from fastapi import FastAPI
from sqlalchemy.orm.session import Session
from backend.arservercontroller.core.config import BaseConfig
from backend.arservercontroller.core.config import get_config
from backend.arservercontroller.db.db import get_db
from backend.arservercontroller.services.logger import get_logger

settings: BaseConfig = get_config()

logger: Logger = get_logger()

db: Generator[Session, Any, None] = get_db()

app: FastAPI = FastAPI()
