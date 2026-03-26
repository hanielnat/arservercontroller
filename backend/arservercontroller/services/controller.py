import socket
from collections.abc import Mapping
from pathlib import Path
from typing import Annotated
from uuid import UUID

import docker
import docker.errors
from docker.models.containers import Container
from fastapi import Depends

from arservercontroller.api.dependencies import DbSessionDep, DockerClientDep
from arservercontroller.constants import (
    CONTAINER_NAME_PREFIX,
    DEFAULT_A2S_PORT,
    DEFAULT_BIND_PORT,
    DEFAULT_RCON_PORT,
    PROTOCOL_A2S_PORT,
    PROTOCOL_BIND_PORT,
    PROTOCOL_RCON_PORT,
    directory_manager,
)
from arservercontroller.db.models.server import Server
from arservercontroller.schemas.server_config import ServerConfig
from arservercontroller.services.creation_manager import (
    ServerCreationManagerDep,
)
from arservercontroller.services.docker import (
    DockerContainerManagerDep,
)
from arservercontroller.services.logger import get_logger

logger = get_logger(__name__)

PortMap = Mapping[str, int | list[int] | tuple[str, int] | None]
ControllerResult = tuple[bool, str]


class ServerControllerV2:
    def __init__(
        self,
        db: DbSessionDep,
        docker_client: DockerClientDep,
        docker_manager: DockerContainerManagerDep,
        creation_manager: ServerCreationManagerDep,
    ) -> None:
        # constante temporária
        self.DEFAULT_CONTAINER_IMAGE_DIR: Path = (
            directory_manager.base_directories.ROOT_DIR / "Reforger.Dockerfile"
        )
        self.DEFAULT_CONTAINER_IMAGE_NAME: str = "arserver-mock:latest"

        self.ARGS_FILE_ENV: str = "ARGS_FILE"
        self.ARGS_FILE_PATH: str = "/data/controller"
        self.ARGS_FILE: str = "args.txt"

        self._db = db
        self._docker = docker_client
        self.docker_manager = docker_manager
        self.creation_manager = creation_manager
        self._container_name_prefix = "arserver_"

        try:
            _ = self._ping()

        except docker.errors.APIError as e:
            logger.error(
                "Erro ao inicializar o docker client.Operações com containers irão falhar a partir desse ponto."
            )
            logger.exception(e)

    def _refresh_and_commit(self, model: object):
        self._db.commit()
        self._db.refresh(model)

    def _ping(self) -> bool:
        return self._docker.ping()

    def _make_container_name(self, server_name: str) -> str:
        return self._container_name_prefix + server_name

    def _make_command_line(
        self,
        profile_path: str,
        config_path: str,
        server_cmd_line: list[str] | str | None,
    ) -> list[str]:
        command_line: list[str] = []

        command_line.append("-profile")
        command_line.append(profile_path)

        command_line.append("-config")
        command_line.append(config_path)

        if server_cmd_line:
            command_line.extend([cmd for cmd in server_cmd_line if cmd.startswith("-")])

        return command_line

    def _get_random_unused_port(self):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("", 0))
            return s.getsockname()[1]

    def _get_server_config_path(self, server_config: ServerConfig):
        # handle test server config
        testing_config = (
            directory_manager.controller_directories.DS_CONFIGS_DIR / "base.json"
        )
        testing_config_exists = Path.exists(testing_config)

        if server_config.name == "test-server" and testing_config_exists:
            return str(
                directory_manager.controller_directories.DS_CONFIGS_DIR / "base.json"
            )
        elif not testing_config_exists:
            return ""

        # default case
        config = (
            directory_manager.controller_directories.DS_CONFIGS_DIR
            / f"{server_config.name}.json"
        )
        return (
            server_config.arserver_config_path or str(config)
            if Path.exists(config)
            else ""
        )

    def _get_server_profile_path(self, server_config: ServerConfig):
        profile_name = server_config.arserver_profile_path or server_config.name
        profiles_dir = directory_manager.controller_directories.DS_PROFILES_DIR
        return str(Path(profiles_dir / profile_name))

    async def add_serverV2(
        self,
        server: Server,
    ) -> ServerConfig:
        if not server.server_config_data:
            raise ValueError("Server config data is None")

        config: ServerConfig = server.server_config_data

        self._db.add(server)
        self._db.commit()
        self._db.refresh(server)

        await self.creation_manager.start_creation(
            server, config, self.DEFAULT_CONTAINER_IMAGE_NAME
        )

        logger.info(
            "Server creation started for '%s' (id: '%s')", config.name, server.id
        )

        out_server = ServerConfig.model_validate(obj=server.server_config_data)

        return out_server

    async def cancel_creation(self, server_id: UUID) -> bool:
        try:
            cancelled = self.creation_manager.cancel_creation(server_id)
            if cancelled:
                logger.info("Creation cancelled for server id '%s'", server_id)

        except Exception as err:
            logger.exception(err)
            return False

        return cancelled

    def add_server(
        self,
        server: Server,
        ports: PortMap | None = None,
        environ: dict[str, str] | None = None,
        *docker_args,
        **docker_kwargs,
    ) -> ControllerResult:
        success: bool = True

        if not server.server_config_data:
            return (not success, "Server config data is `None`")

        server_config = server.server_config_data

        port_bindings: PortMap = {
            f"{server_config.bind_port}/{PROTOCOL_BIND_PORT}": DEFAULT_BIND_PORT,
            f"{server_config.a2s_port}/{PROTOCOL_A2S_PORT}": DEFAULT_A2S_PORT,
            f"{server_config.rcon_port}/{PROTOCOL_RCON_PORT}": DEFAULT_RCON_PORT,
        }

        if ports:
            port_bindings = {
                f"{ports['bind']}/{PROTOCOL_BIND_PORT}": DEFAULT_BIND_PORT,
                f"{ports['a2s']}/{PROTOCOL_A2S_PORT}": DEFAULT_A2S_PORT,
                f"{ports['rcon']}/{PROTOCOL_RCON_PORT}": DEFAULT_RCON_PORT,
            }

        host_config_path = self._get_server_config_path(server_config)
        if not host_config_path:
            return (not success, "Server config file not found.")

        host_profile_path = self._get_server_profile_path(server_config)

        container_directories = directory_manager.get_container_directories(
            server_config.name
        )
        container_config_file: str = str(container_directories.CONTAINER_CONFIG_FILE)
        container_profile_path: str = str(container_directories.CONTAINER_PROFILE_DIR)

        volumes: dict[str, dict[str, str]] = {
            host_config_path: {
                "bind": container_config_file,
                "mode": "rw",
            },
            host_profile_path: {
                "bind": container_profile_path,
                "mode": "rw",
            },
        }

        try:
            reforger_server_volume = self._docker.volumes.get("reforger")
        except (docker.errors.NotFound, docker.errors.APIError):
            reforger_server_volume = self._docker.volumes.create("reforger")

        volumes[reforger_server_volume.name] = {"bind": "/reforger", "mode": "rw"}

        host_args_path = Path(
            str(
                directory_manager.controller_directories.CONTROLLER_DIR / self.ARGS_FILE
            )
        )

        command_line: str = " ".join(
            self._make_command_line(
                container_profile_path,
                container_config_file,
                server_config.command_line,
            )
        )

        with open(host_args_path, "w") as f:
            f.write(command_line)

        container_args_path: str = str(
            container_directories.CONTAINER_CONTROLLER_DIR / self.ARGS_FILE
        )
        volumes[str(host_args_path)] = {
            "bind": container_args_path,
            "mode": "ro",
        }

        container: Container | None = None
        try:
            create_kwargs = {
                "name": self._make_container_name(server_config.name),
                "environment": environ,
                "ports": port_bindings,
                "volumes": volumes,
                "detach": True,
            }

            if "image" not in docker_kwargs:
                create_kwargs["image"] = str(self.DEFAULT_CONTAINER_IMAGE_NAME)

            create_kwargs.update(docker_kwargs)

            try:
                _ = self._docker.images.get(self.DEFAULT_CONTAINER_IMAGE_NAME)

            except docker.errors.ImageNotFound:
                logger.info(
                    "Server container image not found, pulling '%s'...",
                    self.DEFAULT_CONTAINER_IMAGE_NAME,
                )

                (repo, tag) = self.DEFAULT_CONTAINER_IMAGE_NAME.split(":")
                _ = self._docker.images.pull(repo, tag)
                logger.info("Done")

            container = self._docker.containers.create(
                *docker_args,
                **create_kwargs,  # type: ignore
            )

            if not container.id:
                msg = "Erro ao recuperar o id do container pelo docker"
                logger.error(msg)
                return (not success, msg)

            success = True

            server.server_config_data = server.server_config_data.model_copy(
                update={"status": container.status, "container_id": container.id}
            )

        except docker.errors.APIError as e:
            msg = "Erro ao criar container para o server '%s'" % server_config.id
            logger.error(msg)
            logger.exception(e)

            return (not success, f"{msg}: {e}")

        finally:
            if not success:
                if host_args_path.exists():
                    host_args_path.unlink()

                if container and container.id:
                    container.remove(v=True, force=True)

                # self._cleanup_volumes(volumes)

        return (success, "")

    def remove_server(self, server_config: ServerConfig) -> bool:
        try:
            container: Container | None = self._docker.containers.get(
                server_config.container_id
            )
            container.remove()

        except (docker.errors.APIError, docker.errors.NotFound) as e:
            container = None
            logger.exception(e)
            return False

        return True

    def start(self, model: Server) -> ControllerResult:
        server_config: ServerConfig | None = model.server_config_data
        if not server_config:
            msg = (
                "Server '%s' não tem uma instancia de 'ServerConfig', é 'None'."
                % model.id
            )
            logger.error(msg)
            return False, msg

        container_id = server_config.container_id

        try:
            container: Container | None = self._docker.containers.get(str(container_id))
        except docker.errors.NotFound as e:
            container = None
            msg = (
                "Container '%s' não encontrado. Certifique-se de que o servidor foi criado corretamente."
                % model.id,
            )

            logger.error(msg)
            logger.exception(e)
            return False, f"{msg}: {e}"

        try:
            logger.info("Iniciando container do Server '%s'...", model.id)
            container.start()
            server_config = server_config.model_copy(
                update={"status": container.status}
            )
            logger.info("Container do Server '%s' iniciado.", model.id)
        except (docker.errors.APIError, Exception) as e:
            msg = "Erro ao iniciar container '%s'" % container_id
            logger.error(msg)
            logger.exception(e)
            return False, f"{msg}: {e}"
        return True, ""

    def stop(self, model: Server) -> bool:
        server_config = model.server_config_data
        if not server_config:
            logger.error(
                "Server '%s' não tem uma instancia de 'ServerConfig', é 'None'."
                % model.id
            )
            return False

        container_id = server_config.container_id
        try:
            container: Container | None = self._docker.containers.get(container_id)
        except docker.errors.APIError as e:
            container = None
            logger.error(
                "Container '%s' não encontrado. Certifique-se de que o servidor foi criado corretamente."
                % model.id,
            )
            logger.exception(e)
            return False

        try:
            logger.info("Parando container do Server '%s'...", model.id)
            container.stop()
            self._update_status(model, container)
            logger.info("Container do Server '%s' parado.", model.id)
        except (docker.errors.APIError, Exception) as e:
            logger.error("Erro ao parar container '%s'" % container_id)
            logger.exception(e)
            return False
        return True

    def restart(self, model: Server) -> bool:
        server_config = model.server_config_data
        if not server_config:
            logger.error(
                "Server '%s' não tem uma instancia de 'ServerConfig', é 'None'."
                % model.id
            )
            return False

        container_id = server_config.container_id
        try:
            container: Container | None = self._docker.containers.get(container_id)
        except docker.errors.APIError as e:
            container = None
            logger.error(
                "Container '%s' não encontrado. Certifique-se de que o servidor foi criado corretamente."
                % model.id,
            )
            logger.exception(e)
            return False

        try:
            logger.info("Reiniciando container do Server '%s'...", model.id)

            server_config = server_config.model_copy(
                update={"status": container.status}
            )

            container.restart()

            server_config = server_config.model_copy(
                update={"status": container.status}
            )

            logger.info("Container do Server '%s' reiniciado.", model.id)
        except (docker.errors.APIError, Exception) as e:
            logger.error("Erro ao reiniciar container '%s'" % container_id)
            logger.exception(e)
            return False
        return True


def get_server_controller(
    db: DbSessionDep,
    docker_client: DockerClientDep,
    docker_manager: DockerContainerManagerDep,
    creation_manager: ServerCreationManagerDep,
) -> ServerControllerV2:
    return ServerControllerV2(db, docker_client, docker_manager, creation_manager)


ServerControllerDep = Annotated[ServerControllerV2, Depends(get_server_controller)]
