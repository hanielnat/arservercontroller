from contextlib import asynccontextmanager
from logging import Logger

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from arservercontroller.api.dependencies import get_docker_client
from arservercontroller.api.v1.servers import server_router
from arservercontroller.api.v1.users import roles_router, users_router
from arservercontroller.core.config import BaseConfig, DevelopmentConfig, get_config
from arservercontroller.db.models.server import Server
from arservercontroller.db.session import get_db
from arservercontroller.services.controller import get_server_controller
from arservercontroller.services.creation_manager import get_server_creation_manager
from arservercontroller.services.docker import get_docker_manager
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
    db = next(get_db())
    docker_client = get_docker_client()
    docker_manager = get_docker_manager(docker_client)
    server_controller = get_server_controller(
        db, docker_client, docker_manager, get_server_creation_manager(docker_manager)
    )

    network = docker_manager.get_or_create_agent_network()
    if network:
        logger.info("Created agent network.")

    # start servers that weren't properly closed because the docker host killed them by turning off or by crashing
    servers = db.query(Server).all()
    for server in servers:
        if server_controller.is_server_running(server):
            continue

        await server_controller.start(server)

    db.close()
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
