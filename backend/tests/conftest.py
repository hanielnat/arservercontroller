import asyncio
from collections.abc import AsyncGenerator, Generator
from typing import Any

import docker
import pytest
import pytest_asyncio
from arservercontroller.api.dependencies import get_docker_client
from arservercontroller.db.base import Base
from arservercontroller.db.session import get_db
from arservercontroller.main import app as fastapi_app
from arservercontroller.services.controller import (
    ServerControllerV2,
    get_server_controller,
)
from arservercontroller.services.creation_manager import (
    ServerCreationManager,
    get_server_creation_manager,
)
from arservercontroller.services.docker import (
    DockerContainerManager,
    get_docker_manager,
)
from arservercontroller.services.server_config import (
    ServerConfigManagerV2,
    get_server_config_manager,
)
from docker.client import DockerClient
from docker.models.containers import Container
from fastapi.applications import FastAPI
from fastapi.testclient import TestClient
from pytest_mock import MockerFixture
from sqlalchemy import create_engine
from sqlalchemy.engine.base import Engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.asyncio.engine import AsyncEngine
from sqlalchemy.orm import Session, sessionmaker

from tests.constants import DOCKER_CLIENT, TestDirectories
from tests.test_utils import TestUtils


# -------------------------------------------------------------------------------
# pytest-asyncio configuration
@pytest.fixture(scope="session")
def event_loop_policy():
    """Use uvloop if available, otherwise default (recommended for FastAPI)."""
    try:
        import uvloop

        asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    except ImportError:
        pass

    return asyncio.get_event_loop_policy()


# -------------------------------------------------------------------------------
# sync fixtures
@pytest.fixture(scope="session")
def engine() -> Generator[Engine, Any, None]:
    """In-memory SQLite engine (reset per test session)."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)

    yield engine
    Base.metadata.drop_all(engine)


@pytest.fixture(scope="function")
def db_session(engine: Engine) -> Generator[Session, None, None]:
    """Fresh DB session per test function (transaction rollback)."""
    connection = engine.connect()
    transaction = connection.begin()
    SessionLocal = sessionmaker(bind=connection)
    session = SessionLocal()

    yield session
    session.close()
    transaction.rollback()
    connection.close()


# -------------------------------------------------------------------------------
# async fixtures
@pytest_asyncio.fixture(scope="session")
async def async_engine():
    """Async SQLite engine for full async tests."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def async_db_session(
    async_engine: AsyncEngine,
) -> AsyncGenerator[AsyncSession, None]:
    """Exclusive async session per test with rollback."""
    async_session = async_sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()


# -------------------------------------------------------------------------------
# dependency overrides
@pytest.fixture
def test_db(db_session: Session) -> Generator[Session, Any, None]:
    """FastAPI dependency override for DB."""

    def override_get_db() -> Generator[Session, Any, None]:
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db

    yield db_session
    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def async_test_db(async_db_session: AsyncSession):
    """Override for fully async DB, future-proof."""

    async def override_get_db():
        yield async_db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db
    yield async_db_session
    fastapi_app.dependency_overrides.clear()


# -------------------------------------------------------------------------------
# services, mocked and real
@pytest.fixture(scope="session")
def docker_client() -> Generator[docker.DockerClient, Any, None]:
    """Real Docker client for integration tests (cleaned in test teardown)."""
    yield DOCKER_CLIENT

    # Cleanup containers and volumes with the specific label
    try:
        # Containers
        containers: list[Container] = DOCKER_CLIENT.containers.list(
            all=True, filters={"label": "com.arservercontroller=true"}
        )
        for container in containers:
            try:
                container.remove(force=True)
                print(f"Removed test container: '{container.name}'")
            except Exception:
                pass

        # Volumes
        volumes = DOCKER_CLIENT.volumes.list(
            filters={"label": "com.arservercontroller=true"}
        )
        for volume in volumes:
            try:
                volume.remove(force=True)
                print(f"Removed test volume: '{volume.id}'")
            except Exception:
                pass
    except Exception:
        pass

    # Cleanup host directories
    import shutil

    from tests.constants import TestDirectories

    shutil.rmtree(TestDirectories.CONTROLLER_DIR, ignore_errors=True)
    print(f"Removed test host directory: '{TestDirectories.CONTROLLER_DIR}'")


@pytest.fixture
def mock_docker_client(mocker: MockerFixture) -> Any:
    """Mocked Docker client for unit tests."""
    return mocker.Mock(spec=docker.DockerClient)


@pytest.fixture
def docker_manager(
    docker_client: docker.DockerClient,
) -> Generator[DockerContainerManager, Any, None]:
    docker_manager = DockerContainerManager(docker_client)

    yield docker_manager


@pytest.fixture
async def async_docker_manager(docker_client: docker.DockerClient):
    async_docker_manager = DockerContainerManager(docker_client)

    yield async_docker_manager


@pytest.fixture
def server_creation_manager(
    docker_manager: DockerContainerManager, test_db: Session
) -> Generator[ServerCreationManager, Any, None]:
    server_creation_manager = ServerCreationManager(docker_manager, test_db)

    yield server_creation_manager


@pytest.fixture
async def async_server_creation_manager(
    async_docker_manager: DockerContainerManager, test_db: Session
):
    async_server_creation_manager = ServerCreationManager(async_docker_manager, test_db)

    yield async_server_creation_manager


@pytest.fixture
def server_controller(
    test_db: Session,
    docker_client: docker.DockerClient,
    docker_manager: DockerContainerManager,
    server_creation_manager: ServerCreationManager,
) -> Generator[ServerControllerV2, Any, None]:
    """Real `ServerController`."""
    controller = ServerControllerV2(
        db=test_db,
        docker_client=docker_client,
        docker_manager=docker_manager,
        creation_manager=server_creation_manager,
    )

    yield controller


@pytest_asyncio.fixture
async def async_server_controller(
    test_db: Session,
    docker_client: docker.DockerClient,
    async_docker_manager: DockerContainerManager,
    async_server_creation_manager: ServerCreationManager,
) -> ServerControllerV2:
    """Real async `ServerController`."""
    return ServerControllerV2(
        db=test_db,
        docker_client=docker_client,
        docker_manager=async_docker_manager,
        creation_manager=async_server_creation_manager,
    )


@pytest.fixture
def mock_server_controller(
    mocker: MockerFixture, test_db: Session, mock_docker_client: Any
) -> Any:
    """Mocked `ServerController` for unit tests."""
    mock_ctrl = mocker.Mock(spec=ServerControllerV2)

    # TODO: preconfigure common returns
    return mock_ctrl


@pytest.fixture
def config_manager(test_db: Session) -> ServerConfigManagerV2:
    """Real `ServerConfigManager`."""
    return ServerConfigManagerV2(db=test_db)


@pytest_asyncio.fixture
async def async_config_manager(async_test_db) -> ServerConfigManagerV2:
    """Real async `ServerConfigManager`."""
    return ServerConfigManagerV2(db=async_test_db)


@pytest.fixture
def mock_config_manager(mocker: MockerFixture, test_db: Session) -> Any:
    """Mocked `ServerConfigManager`."""
    return mocker.Mock(spec=ServerConfigManagerV2)


# -------------------------------------------------------------------------------
# test client
@pytest.fixture
def client(test_app: FastAPI) -> TestClient:
    """TestClient that simulates real API calls with the overridden app."""
    return TestClient(test_app)


# -------------------------------------------------------------------------------
# app with overrides
@pytest.fixture
def test_app(
    test_db: Session,
    docker_client: docker.DockerClient,
    docker_manager: DockerContainerManager,
    server_creation_manager: ServerCreationManager,
    server_controller: ServerControllerV2,
    config_manager: ServerConfigManagerV2,
) -> Generator[FastAPI, Any, None]:
    """FastAPI app with all dependencies overridden."""

    def override_docker_client() -> DockerClient:
        return docker_client

    def override_docker_manager() -> DockerContainerManager:
        return docker_manager

    def override_server_creation_manager() -> ServerCreationManager:
        return server_creation_manager

    def override_controller() -> ServerControllerV2:
        return server_controller

    def override_config_manager() -> ServerConfigManagerV2:
        return config_manager

    fastapi_app.dependency_overrides[get_docker_client] = override_docker_client
    fastapi_app.dependency_overrides[get_docker_manager] = override_docker_manager
    fastapi_app.dependency_overrides[get_server_creation_manager] = (
        override_server_creation_manager
    )

    fastapi_app.dependency_overrides[get_server_controller] = override_controller
    fastapi_app.dependency_overrides[get_server_config_manager] = (
        override_config_manager
    )

    yield fastapi_app
    fastapi_app.dependency_overrides.clear()


# re-export test helpers so they stay available
__all__ = ["TestUtils", "TestDirectories"]
