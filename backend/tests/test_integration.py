import os
import shutil
import docker.errors
from docker.models.containers import Container
import pytest
from arservercontroller.ARServer import ARServer, EnumARServerStatus
import tests.constants as constants
from typing import Any, Generator
from arservercontroller.configs import ServerConfigManager, ServerConfigType
from arservercontroller.controller import ARServerController
from tests.test_utils import TestUtils


class TestError(RuntimeError):
    pass


class IntegrationTestError(TestError):
    pass


class TestDockerIntegration:
    @pytest.fixture(scope="class")
    def config_manager(
        self,  # server_config: ARServerConfigType
    ) -> Generator[ServerConfigManager, Any, None]:
        try:
            config_manager = ServerConfigManager(
                base_configs_path=constants.CONFIG_MANAGER_CONFIGS_DIR,
                base_configs_file=constants.CONFIG_MANAGER_CONFIGS_FILE,
            )
        except Exception as e:
            raise IntegrationTestError(
                f"Failed to initialize ServerConfigManager: {e}"
            ) from e

        yield config_manager
        config_manager.remove_configs()

    @pytest.fixture(scope="class", autouse=True)
    def clear_test_names(self):
        """Limpa `_used_names: set` antes de cada classe teste."""
        TestUtils.clear_used_names()

    @pytest.fixture(scope="class")
    def arserver_controller(
        self,
        config_manager: ServerConfigManager,
        # server_config: ServerConfigType
    ) -> Generator[ARServerController, Any, None]:
        try:
            arserver_controller = ARServerController(
                config_manager=config_manager,
                root_path=constants.CONTROLER_ROOT,
                container_name_prefix=constants.SERVER_PREFIX,
                docker_client=constants.DOCKER_CLIENT,
            )
        except Exception as e:
            raise IntegrationTestError(
                f"Failed to initialize ARServerController: {e}"
            ) from e

        if not arserver_controller.initialize_directories():
            raise IntegrationTestError(
                "Failed to initialize directories for ARServerController"
            )

        created_containers: list[str] = []
        original_create_server = arserver_controller.create_server

        def tracked_create_server(*args, **kwargs) -> bool:
            """Chama `ARServerController.create_server` e guarda `server_name` em uma lista para persistencia dos nomes."""
            server_name: str | None = args[0] if args else kwargs.get("server_name")
            result: bool = original_create_server(*args, **kwargs)

            if result and server_name:
                container_name: str = f"{constants.SERVER_PREFIX}{server_name}"
                created_containers.append(container_name)
            return result

        arserver_controller.create_server = tracked_create_server

        yield arserver_controller

        # Remover containers criados nos testes.
        for container_name in created_containers:
            try:
                container: Container = arserver_controller.docker_client.containers.get(
                    container_name
                )
                if container.status == "running":
                    container.stop(timeout=5)
                container.remove(force=True)
                print(f"Removed test container: '{container_name}'")
            except docker.errors.NotFound:
                # Pular pois o container não existe.
                pass
            except docker.errors.APIError as e:
                print(f"Error removing test container '{container_name}': {e}")

        arserver_controller.create_server = original_create_server

        # Remove os volumes após testes.
        for path in os.listdir(constants.CONTROLLER_VOLUMES):
            shutil.rmtree(f"{constants.CONTROLLER_VOLUMES}/{path}", True)

        arserver_controller.__exit__()

    def test_docker_version(
        self,
        arserver_controller: ARServerController,
        capsys: pytest.CaptureFixture[str],
    ):
        # Act
        result: dict = {}
        try:
            result = arserver_controller.docker_client.version()
        except docker.errors.APIError as e:
            AssertionError(f"Erro ao obter versão do Docker: {e}")

        print(result)
        captured_output = capsys.readouterr().out

        # Assert
        assert len(result.items()) != 0
        assert "Version" in result, "Docker version not found in the result"
        assert (
            "Version" in captured_output
        ), "Docker version not found in the captured output"

    def test_docker_client_initialization(
        self, arserver_controller: ARServerController
    ):
        # Act
        docker_client = arserver_controller.docker_client

        # Assert
        assert docker_client is not None, "Docker client should be initialized"
        assert isinstance(
            docker_client, docker.DockerClient
        ), "Docker client should be an instance of DockerClient"

    # TODO: implementar testes de verificação de configs após criação do servidor
    def test_server_creation(self, arserver_controller: ARServerController):
        # Act
        # user_role: str = "admin"
        server_name = TestUtils.generate_unique_server_name("creation")
        result: bool = arserver_controller.create_server(
            server_name,
            TestUtils.generate_unique_server_port("udp"),
            constants.SERVER_CONFIG,
        )

        config = arserver_controller.get_server_config(server_name)
        if not config:
            raise AssertionError(
                f"Erro ao obter config do servidor '{server_name}' durante o teste."
            )

        # Assert
        assert result is True
        assert isinstance(
            config, ServerConfigType
        ), "Created server config must be of types ServerConfigType or ARServer"
        assert server_name is config.server_name

    def test_server_creation_stores_container_id(
        self,
        arserver_controller: ARServerController,
        config_manager: ServerConfigManager,
    ):
        # Act
        # user_role: str = "admin"
        server_name = TestUtils.generate_unique_server_name("creation_stores")
        result: bool = arserver_controller.create_server(
            server_name,
            TestUtils.generate_unique_server_port("udp"),
            constants.SERVER_CONFIG,
        )

        # Assert
        assert result is True

        server_config: ServerConfigType = config_manager.get_server(server_name)
        assert server_config is not None, "Server config should not be None"

        # Verificar se o ID do container está guardado no config manager.
        container_id: str | None = server_config.arserver_config.container_id

        assert (
            server_config.arserver_config.container_id is not None
        ), "Container ID should be stored in the server config"

        try:
            server_container: Container = (
                arserver_controller.docker_client.containers.get(
                    f"{constants.SERVER_PREFIX}{server_name}"
                )
            )
        except docker.errors.NotFound as e:
            raise AssertionError(
                f"Container do servidor '{server_name}' não encontrado. '{e}'"
            )
        except docker.errors.APIError as e:
            raise AssertionError(
                f"Erro inesperado ao obter container do servidor '{server_name}'. '{e}'"
            )

        assert (
            container_id == server_container.id
        ), "'container_id' must be the same as `Container.id` got from Docker client."

    def test_server_removal(self, arserver_controller: ARServerController):
        # Act
        user_role: str = "admin"
        server_name = TestUtils.generate_unique_server_name("removal")

        created = arserver_controller.create_server(
            server_name,
            TestUtils.generate_unique_server_port("udp"),
            constants.SERVER_CONFIG,
        )
        if not created:
            raise IntegrationTestError("Failed to create test server for removal test")

        result: bool = arserver_controller.remove_server(server_name, user_role)

        # Assert
        assert result is True

    def test_list_servers(self, arserver_controller: ARServerController):
        # Act
        user_role: str = "admin"
        server_1: str = TestUtils.generate_unique_server_name("list")
        server_2: str = TestUtils.generate_unique_server_name("list")
        config_server_1: str = f"{constants.CONTROLLER_CONFIGS}/testServerConfig_1.json"
        config_server_2: str = f"{constants.CONTROLLER_CONFIGS}/testServerConfig_2.json"
        port_server_1: dict[str, int] = TestUtils.generate_unique_server_port("udp")
        port_server_2: dict[str, int] = TestUtils.generate_unique_server_port("udp")

        created_1: bool = arserver_controller.create_server(
            server_1, port_server_1, config_server_1
        )
        if not created_1:
            raise IntegrationTestError(
                "Failed to create test server 1 for listing test"
            )

        created_2: bool = arserver_controller.create_server(
            server_2, port_server_2, config_server_2
        )
        if not created_2:
            raise IntegrationTestError(
                "Failed to create test server 2 for listing test"
            )

        started_1: bool = arserver_controller.start(server_1, user_role)
        if not started_1:
            raise IntegrationTestError("Failed to start test server 1 for listing test")

        started_2: bool = arserver_controller.start(server_2, user_role)
        if not started_2:
            raise IntegrationTestError("Failed to start test server 2 for listing test")

        servers: list[ARServer] = arserver_controller.get_running_servers()

        # Assert
        assert isinstance(servers, list), "Expected a list of ARServer objects"
        assert all(
            isinstance(server, ARServer) for server in servers
        ), "All items should be ARServer instances"

        assert len(servers) == 2, "Expected exactly two servers in the list"

        assert any(
            server.server_name == f"{server_1}" for server in servers
        ), "Expected server 1 to be in the list"
        assert any(
            server.server_name == f"{server_2}" for server in servers
        ), "Expected server 2 to be in the list"

    def test_server_start(self, arserver_controller: ARServerController):
        # Act
        user_role: str = "admin"
        server_name = TestUtils.generate_unique_server_name("start")

        # Create the server first if it doesn't exist
        created: bool = arserver_controller.create_server(
            server_name,
            TestUtils.generate_unique_server_port("udp"),
            constants.SERVER_CONFIG,
        )
        if not created:
            raise IntegrationTestError("Failed to create test server for start test")

        result: bool = arserver_controller.start(server_name, user_role)

        # Assert
        assert result is True

    def test_server_servernotfound_error(self, arserver_controller: ARServerController):
        # Act
        user_role: str = "admin"
        non_existent_server = TestUtils.generate_unique_server_name("nonexistent")
        result: bool = arserver_controller.start(non_existent_server, user_role)

        # Assert
        assert result is False, "Expected APIError when starting non-existent server"

    def test_server_throws_error_on_invalid_config(
        self, arserver_controller: ARServerController
    ):
        pytest.skip("Esse teste não está implementado ainda.")
        assert False, "Esse teste não está implementado ainda."
        # Act
        # user_role: str = "admin"
        # server_name = TestUtils.generate_unique_server_name("test_invalid_config")
        # invalid_config_path = "invalid_config.json"
        # result: bool = arserver_controller.create_server(
        #     server_nameTestUtils.generate_unique_server_port("udp")RT, invalid_config_path

        # )
        # Assert
        # assert (
        #     result is False
        # ), "Expected APIError when creating server with invalid config"

    def test_server_stop(self, arserver_controller: ARServerController):
        # Act
        user_role: str = "admin"
        server_name = TestUtils.generate_unique_server_name("stop")

        created: bool = arserver_controller.create_server(
            server_name,
            TestUtils.generate_unique_server_port("udp"),
            constants.SERVER_CONFIG,
        )
        if not created:
            raise IntegrationTestError("Failed to create test server for stop test")

        started: bool = arserver_controller.start(server_name, user_role)
        if not started:
            raise IntegrationTestError("Failed to start test server for stop test")

        result: bool = arserver_controller.stop(server_name, user_role)

        # Assert
        assert result is True

    def test_server_restart(self, arserver_controller: ARServerController):
        # Act
        user_role: str = "admin"
        server_name = TestUtils.generate_unique_server_name("restart")

        created: bool = arserver_controller.create_server(
            server_name,
            TestUtils.generate_unique_server_port("udp"),
            constants.SERVER_CONFIG,
        )
        if not created:
            raise IntegrationTestError("Failed to create test server for restart test")

        started: bool = arserver_controller.start(server_name, user_role)
        if not started:
            raise IntegrationTestError("Failed to start test server for restart test")

        result: bool = arserver_controller.restart(server_name, user_role)

        # Assert
        assert result is True

    def test_server_status(self, arserver_controller: ARServerController):
        # Act
        user_role: str = "admin"
        server_name = TestUtils.generate_unique_server_name("status")
        created: bool = arserver_controller.create_server(
            server_name,
            TestUtils.generate_unique_server_port("udp"),
            constants.SERVER_CONFIG,
        )
        if not created:
            raise IntegrationTestError("Failed to create test server for status test")

        started: bool = arserver_controller.start(server_name, user_role)
        if not started:
            raise IntegrationTestError("Failed to start test server for status test")

        servers: list[ARServer] = arserver_controller.get_running_servers()
        for server in servers:
            print(f"Server: {server}")
            status: EnumARServerStatus = server.status

            # Assert
            assert status in list(EnumARServerStatus)
