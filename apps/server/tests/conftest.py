from collections.abc import Generator
from typing import Any

import docker
import pytest
import pytest_asyncio
from arservercontroller.api.dependencies import get_docker_client
from arservercontroller.db.base import Base
from arservercontroller.db.session import get_db
from arservercontroller.main import app as fastapi_app
from arservercontroller.services.controller import (
    ServerController,
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
from docker.client import DockerClient
from docker.models.containers import Container
from fastapi.applications import FastAPI
from fastapi.testclient import TestClient
from pytest_mock import MockerFixture
from sqlalchemy import create_engine
from sqlalchemy.engine.base import Engine
from sqlalchemy.orm import Session, sessionmaker

from tests.constants import DOCKER_CLIENT, TestDirectories
from tests.test_utils import TestUtils


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
# dependency overrides
@pytest.fixture
def test_db(db_session: Session) -> Generator[Session, Any, None]:
    """FastAPI dependency override for DB."""

    def override_get_db() -> Generator[Session, Any, None]:
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db

    yield db_session
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
            except Exception:  # noqa: BLE001, S110
                pass

        # Volumes
        volumes = DOCKER_CLIENT.volumes.list(
            filters={"label": "com.arservercontroller=true"}
        )
        for volume in volumes:
            try:
                volume.remove(force=True)
                print(f"Removed test volume: '{volume.id}'")
            except Exception:  # noqa: BLE001, S110
                pass

    except Exception:  # noqa: BLE001, S110
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
    docker_manager: DockerContainerManager,
    test_db: Session,
) -> Generator[ServerCreationManager, Any, None]:
    session_factory = sessionmaker(
        bind=test_db.get_bind(),
        autocommit=False,
        autoflush=False,
        expire_on_commit=True,
    )
    server_creation_manager = ServerCreationManager(
        docker_manager, session_factory=session_factory
    )

    yield server_creation_manager


@pytest.fixture
async def async_server_creation_manager(
    async_docker_manager: DockerContainerManager,
    test_db: Session,
):
    session_factory = sessionmaker(
        bind=test_db.get_bind(),
        autocommit=False,
        autoflush=False,
        expire_on_commit=True,
    )
    async_server_creation_manager = ServerCreationManager(
        async_docker_manager, session_factory=session_factory
    )

    yield async_server_creation_manager


@pytest.fixture
def server_controller(
    test_db: Session,
    docker_client: docker.DockerClient,
    docker_manager: DockerContainerManager,
    server_creation_manager: ServerCreationManager,
) -> Generator[ServerController, Any, None]:
    """Real `ServerController`."""
    controller = ServerController(
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
) -> ServerController:
    """Real async `ServerController`."""
    return ServerController(
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
    mock_ctrl = mocker.Mock(spec=ServerController)

    # TODO: preconfigure common returns
    return mock_ctrl


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
    server_controller: ServerController,
) -> Generator[FastAPI, Any, None]:
    """FastAPI app with all dependencies overridden."""

    def override_docker_client() -> DockerClient:
        return docker_client

    def override_docker_manager() -> DockerContainerManager:
        return docker_manager

    def override_server_creation_manager() -> ServerCreationManager:
        return server_creation_manager

    def override_controller() -> ServerController:
        return server_controller

    fastapi_app.dependency_overrides[get_docker_client] = override_docker_client
    fastapi_app.dependency_overrides[get_docker_manager] = override_docker_manager
    fastapi_app.dependency_overrides[get_server_creation_manager] = (
        override_server_creation_manager
    )

    fastapi_app.dependency_overrides[get_server_controller] = override_controller

    yield fastapi_app
    fastapi_app.dependency_overrides.clear()


# re-export test helpers so they stay available
__all__ = ["TestDirectories", "TestUtils"]
