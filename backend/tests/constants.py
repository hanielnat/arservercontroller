from pathlib import Path

from arservercontroller.constants import BaseDirectories
from docker import DockerClient
from docker.constants import DEFAULT_UNIX_SOCKET


class TestDirectories(BaseDirectories):
    TESTS_DIR: Path = Path(__file__).parent  # arservercontroller/tests

    CONTROLLER_DIR: str = f"{TESTS_DIR}/test_controller"
    DS_CONFIGS_DIR: str = f"{CONTROLLER_DIR}/ds_configs"
    DS_PROFILES_DIR: str = f"{CONTROLLER_DIR}/profiles"
    CONTAINER_VOLUMES_DIR: str = f"{CONTROLLER_DIR}/volumes"

    CONFIG_MANAGER_CONFIGS_DIR: str = f"{CONTROLLER_DIR}/config-manager"
    CONFIG_MANAGER_CONFIGS_FILE: str = "testConfigs.json"

    DS_BIN_PATH: str = f"{CONTROLLER_DIR}/bin"
    DS_BIN: str = "ArmaReforgerServer"
    DS_CONFIG: str = f"{DS_CONFIGS_DIR}/testServerConfig.json"
    DS_PROFILE: str = f"{DS_PROFILES_DIR}/TestProfile"


SERVER_NAME: str = "server"
SERVER_PREFIX: str = "test_arserver_"
SERVER_PORT: dict[str, int] = {"udp": 3010}
DOCKER_CLIENT: DockerClient = DockerClient(DEFAULT_UNIX_SOCKET, version="auto")
