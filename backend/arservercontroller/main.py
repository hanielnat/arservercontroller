from logging import Logger

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from arservercontroller.api.v1.servers import server_router
from arservercontroller.api.v1.users import roles_router, users_router
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
    docs_url="/docs" if isinstance(settings, DevelopmentConfig) else None,
    redoc_url=None,
    debug=isinstance(settings, DevelopmentConfig),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)

if settings.SERVE_STATIC:
    app.mount(
        "/", StaticFiles(directory=settings.SERVE_STATIC_DIR, html=True), name="static"
    )

logger.info("App started.")

app.include_router(router=server_router, prefix=settings.API_V1_STR)
app.include_router(router=users_router, prefix=settings.API_V1_STR)
app.include_router(router=roles_router, prefix=settings.API_V1_STR)
