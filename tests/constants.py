import os
from docker import DockerClient
from docker.constants import DEFAULT_UNIX_SOCKET

TESTS_DIR: str = os.path.dirname(os.path.abspath(__file__))  # tests/constants.py

CONTROLER_ROOT: str = f"{TESTS_DIR}/test_controller"
CONTROLLER_VOLUMES: str = f"{CONTROLER_ROOT}/volumes"
CONTROLLER_CONFIGS: str = f"{CONTROLER_ROOT}/configs"
CONTROLLER_PROFILES: str = f"{CONTROLER_ROOT}/profiles"

SERVER_NAME: str = "server"
SERVER_PREFIX: str = "test_arserver_"
SERVER_PORT: dict[str, int] = {"udp": 3010}
DOCKER_CLIENT: DockerClient = DockerClient(DEFAULT_UNIX_SOCKET, version="auto")

SERVER_BIN_PATH: str = f"{CONTROLER_ROOT}/bin"
SERVER_BIN: str = "ArmaReforgerServer"

CONFIG_MANAGER_CONFIGS_DIR: str = f"{CONTROLER_ROOT}/config-manager"
CONFIG_MANAGER_CONFIGS_FILE: str = "testConfigs.json"

SERVER_CONFIG: str = f"{CONTROLLER_CONFIGS}/testServerConfig.json"
SERVER_PROFILE_PATH: str = f"{CONTROLLER_PROFILES}/TestProfile"
