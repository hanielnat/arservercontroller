from logging import Logger

from fastapi import FastAPI

from arservercontroller.api.v1.servers import server_router
from arservercontroller.api.v1.users import users_router
from arservercontroller.core.config import BaseConfig, DevelopmentConfig, get_config
from arservercontroller.services.logger import get_logger
from arservercontroller.utils.directories import make_directories

settings: BaseConfig = get_config()

logger: Logger = get_logger(settings.APP_NAME)
logger.info("Logger initialized, starting app...")

make_directories(logger)

app: FastAPI = FastAPI(
    name=settings.APP_NAME,
    version=settings.VERSION,
    debug=isinstance(settings, DevelopmentConfig),
)

app.mount(
    settings.SERVE_STATIC_DIR,
    app,
    "static",
)

logger.info("App started.")

app.include_router(router=server_router)
app.include_router(router=users_router)
