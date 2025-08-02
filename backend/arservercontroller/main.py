from logging import Logger
from typing import Any, Generator

from fastapi import FastAPI
from sqlalchemy.orm.session import Session

import arservercontroller.db.session as db_session
from arservercontroller.core.config import BaseConfig, get_config
from arservercontroller.services.logger import get_logger

settings: BaseConfig = get_config()

logger: Logger = get_logger()

db: Generator[Session, Any, None] = db_session.get_db()

app: FastAPI = FastAPI()
