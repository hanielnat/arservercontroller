import uuid
from contextlib import asynccontextmanager
from logging import Logger

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm.session import Session

from arservercontroller.core.config import BaseConfig, DevelopmentConfig

from .db.models.server import Server

APP_NAME: str = "arservercontroller"

from arservercontroller.services.logger import get_logger

logger: Logger = get_logger(APP_NAME)

_settings: BaseConfig | None = None


def get_settings() -> BaseConfig:
    global _settings
    if _settings is None:
        from arservercontroller.core.config import get_config

        _settings = get_config()
    return _settings


from arservercontroller.api.v1.servers import server_router
from arservercontroller.api.v1.users import roles_router, users_router
from arservercontroller.constants import (
    BIND_IP_AUTOMATIC,
    SERVER_SCHEMA_VERSION,
    ServerStatusEnum,
    UserRoles,
    directory_manager,
)
from arservercontroller.core.security import pwd_context
from arservercontroller.db.models.user import User
from arservercontroller.schemas.server_config import ServerConfigBase
from arservercontroller.services.controller import get_server_controller
from arservercontroller.utils.configs import make_default_server_config
from arservercontroller.utils.directories import make_directories
from arservercontroller.utils.mock_server import setup_test_server

logger.info("Logger initialized, starting app...")
make_directories(logger)
setup_test_server(logger)


def seed_database(db: Session):
    """Seed the database with initial data."""
    admin_user = db.query(User).filter(User.role == UserRoles.ADMIN).first()
    if not admin_user:
        logger.info("No admin user found, creating default admin...")
        admin = User(
            email="admin@arservercontroller.com",
            name="Admin",
            hashed_password=pwd_context.hash("rootroot"),
            role=UserRoles.ADMIN,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        logger.info("Default admin user created.")

    test_server = db.query(Server).filter(Server.name == "test-server").first()
    if not test_server:
        logger.info("No test server found, creating default server...")

        import docker

        docker_client = docker.from_env()
        controller = get_server_controller(db, docker_client)

        default_config_filename = "base"
        make_default_server_config(default_config_filename)

        server_config = ServerConfigBase(
            version=SERVER_SCHEMA_VERSION,
            name="test-server",
            bind_port=2555,
            bind_address=BIND_IP_AUTOMATIC,
            a2s_port=18989,
            rcon_port=18787,
            status=ServerStatusEnum.CREATED,
            command_line="",
            arserver_profile_path="reforger",
            arserver_config_path="",
        )

        server = Server(
            id=str(uuid.uuid4()),
            name="test-server",
            data=server_config.model_dump(),
        )

        db.add(server)

        res, err = controller.add_server(server)
        if not res:
            logger.error("Failed to create test server container:", err)
            return

        db.commit()
        new_server = db.query(Server).filter(Server.name == "test-server").first()

        if new_server:
            logger.info("Default test server created.")
            logger.info(
                f"    ContainerID: {new_server.data.get('container_id', 'null')[:12]}..."
            )
            logger.info(f"    Status: {new_server.data.get('status')}...")

        else:
            logger.error("Test server was created but was not found in database.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Applying database migrations on startup...")
    settings = get_settings()

    try:
        # from alembic import command
        # from alembic.config import Config

        # root_dir = directory_manager.base_directories.ROOT_DIR
        # alembic_cfg = Config()
        # alembic_cfg.set_main_option("script_location", str(root_dir / "alembic"))
        # alembic_cfg.set_main_option("sqlalchemy.url", settings.DB_URL)
        # alembic_cfg.config_file_name = str(root_dir / "alembic.ini")

        # command.upgrade(alembic_cfg, "heads")
        logger.info("Database migrations applied successfully.")

        from .db.session import SessionLocal

        # FIXME: this does't work because of the db session
        # with SessionLocal() as db:
        #     seed_database(db)

        logger.info("Database seeding completed.")
    except Exception as e:
        logger.error(f"Failed to apply migrations or seed database: {e}")
        raise

    yield


app: FastAPI = FastAPI(
    title=APP_NAME,
    version=get_settings().VERSION,
    docs_url="/docs" if isinstance(get_settings(), DevelopmentConfig) else None,
    redoc_url=None,
    debug=isinstance(get_settings(), DevelopmentConfig),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().CORS_ORIGINS,
    allow_credentials=get_settings().CORS_ALLOW_CREDS,
    allow_methods=get_settings().CORS_METHODS,
    allow_headers=get_settings().CORS_HEADERS,
)

if get_settings().SERVE_STATIC:
    app.mount(
        "/",
        StaticFiles(directory=get_settings().SERVE_STATIC_DIR, html=True),
        name="static",
    )

logger.info("App started.")

app.include_router(router=server_router, prefix=get_settings().API_V1_STR)
app.include_router(router=users_router, prefix=get_settings().API_V1_STR)
app.include_router(router=roles_router, prefix=get_settings().API_V1_STR)
