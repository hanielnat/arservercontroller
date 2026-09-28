from pathlib import Path

from docker import DockerClient


class TestDirectories:
    TESTS_DIR: Path = Path(__file__).parent  # arservercontroller/tests

    CONTROLLER_DIR: str = f"{TESTS_DIR}/test_controller"
    DS_PROFILES_DIR: str = f"{CONTROLLER_DIR}/profiles"

    DS_BIN_PATH: str = f"{CONTROLLER_DIR}/bin"
    DS_BIN: str = "ArmaReforgerServer"
    DS_CONFIG: str = f"{DS_PROFILES_DIR}/testServerConfig.json"
    DS_PROFILE: str = f"{DS_PROFILES_DIR}/TestProfile"


SERVER_NAME: str = "server"
SERVER_PREFIX: str = "test_arserver_"
SERVER_PORT: dict[str, int] = {"udp": 3010}
DOCKER_CLIENT: DockerClient = DockerClient(version="auto")
