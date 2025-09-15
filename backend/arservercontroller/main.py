from logging import Logger

from fastapi import FastAPI

from arservercontroller.api.v1.servers import server_router
from arservercontroller.api.v1.users import users_router
from arservercontroller.core.config import BaseConfig, get_config
from arservercontroller.services.logger import get_logger

settings: BaseConfig = get_config()

logger: Logger = get_logger(settings.APP_NAME)
logger.info("Logger initialized, starting app...")

# database = get_db()
# logger.info("Database initialized.")

app: FastAPI = FastAPI()
logger.info("App started.")

app.include_router(router=server_router)
app.include_router(router=users_router)
