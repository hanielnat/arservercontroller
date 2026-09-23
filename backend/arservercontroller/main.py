from contextlib import asynccontextmanager
from logging import Logger

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from arservercontroller.api.v1.servers import server_router
from arservercontroller.api.v1.users import roles_router, users_router
from arservercontroller.core.config import BaseConfig, DevelopmentConfig, get_config
from arservercontroller.services.logger import get_logger
from arservercontroller.utils.directories import make_directories

APP_NAME: str = "arservercontroller"

logger: Logger = get_logger(APP_NAME)

config: BaseConfig = get_config()
is_dev = isinstance(config, DevelopmentConfig)

logger.info("Logger initialized, starting app...")

make_directories(logger)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app: FastAPI = FastAPI(
    title=APP_NAME,
    version=config.VERSION,
    lifespan=lifespan,
    docs_url="/docs" if is_dev else None,
    redoc_url=None,
    debug=is_dev,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=config.CORS_ALLOW_CREDS,
    allow_methods=config.CORS_METHODS,
    allow_headers=config.CORS_HEADERS,
)

if not is_dev:
    app.frontend("/", directory=config.FRONTEND_DIST_DIR)

app.include_router(router=server_router, prefix=config.API_V1_STR)
app.include_router(router=users_router, prefix=config.API_V1_STR)
app.include_router(router=roles_router, prefix=config.API_V1_STR)

logger.info("App started.")
