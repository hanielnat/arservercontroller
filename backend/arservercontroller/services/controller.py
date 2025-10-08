import os
from functools import singledispatchmethod
from pathlib import Path
from typing import Any, Mapping, Optional

import docker
import docker.constants
import docker.errors
from docker import DockerClient
from docker.api.client import APIClient
from docker.models.containers import Container
from fastapi import Depends

from arservercontroller.api.dependencies import (
    Annotated,
    DbSessionDep,
    DockerClientDep,
)
from arservercontroller.constants import (
    CONTAINER_NAME_PREFIX,
    ServerStatusEnum,
    directory_manager,
)
from arservercontroller.db.models.ARServer import ARServer
from arservercontroller.db.models.server import Server, ServerConfig
from arservercontroller.db.models.server_configs import (
    ARServerConfigType,
    ServerConfigType,
)
from arservercontroller.services.logger import get_logger
from arservercontroller.services.server_config import ServerConfigManager

logger = get_logger(__name__)


class ServerControllerV2:
    def __init__(
        self,
        db: DbSessionDep,
        docker_client: DockerClientDep,
        container_name_prefix: str = CONTAINER_NAME_PREFIX,
    ) -> None:
        # constante temporária
        self.DEFAULT_CONTAINER_IMAGE_DIR: Path = (
            directory_manager.base_directories.ROOT_DIR / "reforger.Dockerfile"
        )
        self.DEFAULT_CONTAINER_IMAGE_NAME: str = "arserver:latest"

        self.ARGS_FILE_ENV: str = "ARGS_FILE"
        self.ARGS_FILE_PATH: str = "/data/controller"
        self.ARGS_FILE: str = f"{self.ARGS_FILE_PATH}/args.txt"

        # self.REFORGER_ARGS: str = "REFORGER_ARGS"
        # self.REFORGER_ENV: str = "REFORGER"
        # self.REFORGER_PATH: str = "/reforger"
        # self.REFORGER_BIN: str = f"{self.REFORGER_PATH}/ArmaReforgerServer"
        # self.REFORGER_APPID: int = 1874900

        # self.STEAMCMD_ENV: str = "STEAMCMD"
        # self.STEAMCMD_PATH: str = "/steamcmd"
        # self.STEAMCMD_FILE: str = f"{self.STEAMCMD_PATH}/steamcmd.sh"

        self._db = db
        self._docker = docker_client
        self._container_name_prefix = container_name_prefix

        try:
            self._get_docker_version()
        except docker.errors.APIError as e:
            logger.error(
                "Erro ao inicializar o docker client.Operações com containers irão falhar a partir desse ponto."
            )
            logger.exception(e)

    def _refresh(self, model: object):
        self._db.commit()
        self._db.refresh(model)

    def _get_docker_version(self) -> dict[str, Any]:
        docker_version: dict[str, Any] = {}

        try:
            docker_version = self._docker.version()
            logger.debug("Versão do docker obtida '%s'" % docker_version["Version"])
        except docker.errors.APIError as e:
            logger.exception(e)

        return docker_version

    @singledispatchmethod
    def _update_status(self, model: Server, status: ServerStatusEnum):
        if not model.server_config_data:
            return

        model.server_config_data = model.server_config_data.model_copy(
            update={"status": status}
        )
        self._refresh(model)

    @_update_status.register
    def _(self, model: ServerConfig, container: Container):
        if not model:
            return
        model.update_status(container)

    def _make_container_name(self, server_name: str) -> str:
        return self._container_name_prefix.join(server_name)

    def _make_command_line(self, server_config: ServerConfig) -> list[str]:
        command_line: list[str] = []
        command_line.append("-profile")

        command_line.append(
            server_config.arserver_profile_path
            or str(
                directory_manager.controller_directories.DS_PROFILES_DIR
                / server_config.name
            )
        )

        command_line.append(
            server_config.arserver_config_path
            or str(
                directory_manager.controller_directories.DS_CONFIGS_DIR
                / f"{server_config.name}.json"
            )
        )

        if server_config.command_line:
            command_line.extend(
                [cmd for cmd in server_config.command_line if cmd.startswith("-")]
            )

        return command_line

    def add_server(
        self,
        server_config: ServerConfig,
        environ: Optional[dict[str, str]] = None,
        *docker_args,
        **docker_kwargs,
    ) -> bool:
        port_bindings: Mapping[str, int | list[int] | tuple[str, int] | None] = {
            "reforger_udp": server_config.bind_port,
            "rcon_tcp": server_config.rcon_port,
            "a2s_udp": server_config.a2s_port,
        }

        host_config_path = server_config.arserver_config_path or str(
            directory_manager.controller_directories.DS_CONFIGS_DIR
            / f"{server_config.name}.json"
        )
        host_profile_path = server_config.arserver_profile_path or str(
            directory_manager.controller_directories.DS_PROFILES_DIR
            / server_config.name
        )

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

        host_args_path = str(
            directory_manager.controller_directories.CONTROLLER_DIR / self.ARGS_FILE
        )
        command_line: str = " ".join(self._make_command_line(server_config))
        with open(host_args_path, "w") as f:
            f.write(command_line)

        container_args_path: str = str(
            container_directories.CONTAINER_CONTROLLER_DIR / self.ARGS_FILE
        )
        volumes[host_args_path] = {
            "bind": container_args_path,
            "mode": "rw",
        }

        try:
            container: Container | None = self._docker.containers.create(
                name=self._make_container_name(server_config.name),
                environment=environ,
                image=self.DEFAULT_CONTAINER_IMAGE_NAME,
                ports=port_bindings,
                volumes=volumes,
                detach=True,
                *docker_args,
                **docker_kwargs,
            )

            if not container.id:
                logger.error("Erro ao recuperar o id do container pelo docker.")
                return False

        except (docker.errors.ImageNotFound, docker.errors.APIError) as e:
            logger.error(
                "Erro ao criar container para o server '%s'" % server_config.id,
            )
            logger.exception(e)
            return False

        server_config.container_id = container.id
        self._update_status(model=server_config, container=container)

        return True

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

    def start(self, model: Server) -> bool:
        server_config = model.server_config_data
        if not server_config:
            logger.error(
                "Server '%s' não tem uma instancia de 'ServerConfig', é 'None'."
                % model.id
            )
            return False

        container_id = server_config.container_id

        try:
            container: Container | None = self._docker.containers.get(str(container_id))
        except docker.errors.NotFound as e:
            container = None
            logger.error(
                "Container '%s' não encontrado. Certifique-se de que o servidor foi criado corretamente."
                % model.id,
            )
            logger.exception(e)
            return False

        try:
            logger.info("Iniciando container do Server '%s'...", model.id)
            container.start()
            self._update_status(model, ServerStatusEnum.RUNNING)
            logger.info("Container do Server '%s' iniciado.", model.id)
        except (docker.errors.APIError, Exception) as e:
            logger.error("Erro ao iniciar container '%s'" % container_id)
            logger.exception(e)
            return False
        return True

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
            self._update_status(model, ServerStatusEnum.EXITED)
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
            self._update_status(model, ServerStatusEnum.RESTARTING)
            container.restart()
            self._update_status(model, ServerStatusEnum.RUNNING)
            logger.info("Container do Server '%s' reiniciado.", model.id)
        except (docker.errors.APIError, Exception) as e:
            logger.error("Erro ao reiniciar container '%s'" % container_id)
            logger.exception(e)
            return False
        return True


ServerControllerDep = Annotated[
    ServerControllerV2, Depends(ServerControllerV2.__init__)
]


class ServerController:
    roles: dict[str, list[str]] = {"user": ["view"]}
    default_arserver_image: str = "alpine"
    cpu_percent: int = 50
    cpu_count: int = 8

    def __init__(
        self,
        config_manager: ServerConfigManager,
        docker_client: DockerClient = docker.from_env(),
        docker_api: APIClient = docker.APIClient(docker.constants.DEFAULT_UNIX_SOCKET),
        root_path: Optional[str] = os.environ.get("SERVER_CONTROLLER_DATA_DIR"),
        container_name_prefix: str = "arserver_",
    ) -> None:
        self.docker_client: DockerClient = docker_client
        self.docker_api_client: APIClient = docker_api
        self.config_manager: ServerConfigManager = config_manager

        if not root_path:
            # TODO: usar pathlib
            root_path = ""

        self._root_path: str = root_path
        self._volumes_path: str = root_path + "/volumes"
        self._profiles_path: str = root_path + "/profiles"
        self._configs_path: str = root_path + "/configs"
        self._container_name_prefix: str = container_name_prefix
        self.servers: dict[str, ARServer] = {}
        self.roles: dict[str, list[str]] = self._get_controller_permissions()

    def __exit__(self):
        self.docker_client.close()  # type: ignore

    def __enter__(self):
        return self

    @staticmethod
    def _get_controller_permissions() -> dict[str, list[str]]:
        return {
            "admin": ["create", "delete", "update", "view", "start", "stop", "restart"],
            "moderator": ["update", "view", "start", "stop", "restart"],
            "user": ["view"],
        }

    @property
    def profiles_path(self) -> str:
        """Retorna o caminho do diretório de perfis."""
        return self._profiles_path

    @profiles_path.setter
    def profiles_path(self, value: str) -> None:
        """Define o caminho do diretório de perfis."""
        if not value:
            raise ValueError("O caminho do diretório de perfis não pode ser vazio.")
        self._profiles_path = value

    @property
    def volumes_path(self) -> str:
        """Retorna o caminho do diretório de volumes."""
        return self._volumes_path

    @volumes_path.setter
    def volumes_path(self, value: str) -> None:
        """Define o caminho do diretório de volumes."""
        if not value:
            raise ValueError("O caminho do diretório de volumes não pode ser vazio.")
        self._volumes_path = value

    @property
    def configs_path(self) -> str:
        """Retorna o caminho do diretório de configurações."""
        return self._configs_path

    @configs_path.setter
    def configs_path(self, value: str) -> None:
        """Define o caminho do diretório de configurações."""
        if not value:
            raise ValueError(
                "O caminho do diretório de configurações não pode ser vazio."
            )
        self._configs_path = value

    @property
    def root_path(self) -> str:
        """Retorna o caminho do diretório raiz do controlador."""
        return self._root_path

    @root_path.setter
    def root_path(self, value: str) -> None:
        """Define o caminho do diretório raiz do controlador."""
        if not value:
            raise ValueError("O caminho do diretório raiz não pode ser vazio.")
        self._root_path = value

    @classmethod
    def set_default_image(cls, new_image: str) -> None:
        cls.default_image = new_image

    @classmethod
    def set_cpu_percent(cls, new_cpu_percent: int) -> None:
        cls.cpu_percent = new_cpu_percent

    @classmethod
    def set_cpu_count(cls, new_cpu_count: int) -> None:
        cls.cpu_count = new_cpu_count

    def list_servers_config(self) -> dict[str, list[ServerConfigType]]:
        return self.config_manager.list_servers()

    def get_server_config(self, server_name: str) -> Optional[ServerConfigType]:
        """Recupera a configuração do servidor.

        Args:
            server_name (str): O nome do servidor para o qual recuperar a configuração.

        Returns:
            Optional[ServerConfigType]: Um objeto de configuração, podendo ser `None` se
            a configuração do servidor não for encontrada.
        """
        try:
            config: ServerConfigType = self.config_manager.get_server(server_name)
        except KeyError:
            logger.info(
                "Configuração do servidor para '%s' do tipo 'ServerConfigType' não encontrada.",
                server_name,
            )
            return None
        return config

    # TODO: usar o BaseModel do pydantic para config.arserver_config
    def get_arserver_config(self, server_name: str) -> Optional[ARServerConfigType]:
        try:
            config: ServerConfigType | None = self.get_server_config(server_name)
            if config is None:
                logger.info(
                    "Erro em '%s': config é '%s'",
                    self.get_server_config.__name__,
                    config,
                )
                return None

            return config.arserver_config
        except KeyError:
            logger.info(
                "Configuração do servidor para '%s' do tipo 'ARServerConfigType' não encontrada.",
                server_name,
            )
            return None

    def initialize_directories(self) -> bool:
        """Cria os diretórios necessários para funcionamento do controller."""
        try:
            os.makedirs(self.root_path, exist_ok=True)
            os.makedirs(self._profiles_path, exist_ok=True)
            os.makedirs(self._configs_path, exist_ok=True)
            os.makedirs(self._volumes_path, exist_ok=True)
            logger.info("Diretórios de configuração criados com sucesso.")
        except FileExistsError:
            logger.info("Diretórios de configuração já existem.")
        except OSError as e:
            logger.info("Erro ao criar diretórios de configuração: %s", e)
            return False
        return True

    def has_container_image(self, repository: str, tag: str = "latest") -> bool:
        """Verifica se uma imagem de container existe no repositório especificado."""
        try:
            self.docker_client.images.get(f"{repository}:{tag}")
            return True
        except docker.errors.ImageNotFound:
            return False

    def pull_container_image(self, repository: str, tag: str = "latest"):
        """Baixa uma imagem de container do repositório especificado."""
        try:
            self.docker_client.images.pull(repository=repository, tag=tag)
        except docker.errors.APIError as e:
            logger.info("Erro ao baixar a imagem do container: %s", e)

    def build_dockerfile(self, dockerfile_path: str, tag: str = "latest") -> bool:
        """Constrói uma imagem Docker a partir de um Dockerfile.

        Args:
            dockerfile_path (str): Caminho para o Dockerfile.
            tag (str): Tag para a imagem construída.

        Returns:
            bool: True se a construção for bem-sucedida, False caso contrário.
        """
        if not os.path.exists(dockerfile_path):
            logger.info("Arquivo Dockerfile não encontrado: %s", dockerfile_path)
            return False

        try:
            self.docker_client.images.build(path=dockerfile_path, tag=tag)
            logger.info(
                "Imagem '%s' construída com sucesso a partir do Dockerfile.", tag
            )
            return True
        except docker.errors.BuildError as e:
            logger.info("Erro ao construir a imagem: %s", e)
            return False

    # TODO: a função não está retornando os servidores em execução corretamente
    def get_running_servers(self) -> list[ARServer]:
        """Retorna uma lista de servidores AR em execução."""
        running_servers: list[ARServer] = []
        for _, server in self.servers.items():
            server.container.reload()
            if server.status != ServerStatusEnum.RUNNING:
                continue
            running_servers.append(server)
        return running_servers

    def check_access(self, server_name: str, user_role: str, action: str) -> bool:
        if user_role not in self.roles:
            logger.info("Usuário com role '%s' não reconhecido.", user_role)
            return False

        if action not in self.roles[user_role]:
            logger.info(
                "Usuário com role '%s' não tem permissão para '%s'.", user_role, action
            )
            return False

        # TODO: implementar RBAC para escopo do servidor.
        # if self.servers.get(server_name) is None:
        #     if not self.config_manager.get_server(server_name):
        #         logger.info(\1)
        #         return False

        return True

    # TODO: usar o BaseModel do pydantic para config.arserver_config
    def start(self, server_name: str, user_role: str = "user") -> bool:
        if user_role not in self.roles:
            user_role = "user"

        if not self.check_access(server_name, user_role, "start"):
            return False

        # 'start' já sabe como obter um 'ARServer' do arquivo de config.
        if server_name not in self.config_manager.list_servers():
            logger.info("Configuração do servidor '%s' não encontrada.", server_name)
            return False

        config: ServerConfigType | None = self.get_server_config(server_name)
        if not config:
            logger.info(
                "Erro ao recuperar config do tipo 'ServerConfigType' para prosseguir com o start do container."
            )
            return False

        if not config.arserver_config:
            logger.info(
                "Erro ao recuperar config do tipo 'ARServerConfigType' para prosseguir com o start do container."
            )
            return False

        try:
            server: ARServer | None = self.servers.get(server_name)
        except KeyError:
            server = None

        try:
            container: Container | None = self.docker_client.containers.get(
                f"{self._container_name_prefix}{server_name}"
            )
        except docker.errors.NotFound:
            container = None
            logger.info(
                "Container '%s' não encontrado. Certifique-se de que o servidor foi criado corretamente.",
                f"{self._container_name_prefix}{server_name}",
            )
            return False

        if not server:
            server = ARServer(
                server_name=server_name,
                server_config=config.arserver_config,
                container=container,
                status=ServerStatusEnum.CREATED,  # CREATED é o status inicial
            )

        self.servers[server_name] = server
        logger.info(
            "Servidor '%s' atualizado na lista de servidores. %s",
            server_name,
            [s.server_name for s in self.servers.values()],
        )

        if container.status == ServerStatusEnum.RUNNING.value:
            logger.info("Container '%s' já está em execução.", server_name)
            return True

        try:
            logger.info("Iniciando o container '%s'...", server_name)
            container.start()

            old_status: str = server.status.value
            server.update_container_status()
            logger.info(
                "Status do container '%s': antigo -> '%s', novo -> '%s'",
                server_name,
                old_status,
                server.status.value,
            )

            logger.info("Container '%s' iniciado com sucesso.", server_name)
        except docker.errors.APIError as e:
            logger.info("Erro ao iniciar o container '%s': %s", server_name, e)
            return False
        return True

    # TODO: usar o BaseModel do pydantic para config.arserver_config
    def stop(self, server_name: str, user_role: str = "user") -> bool:
        if user_role not in self.roles:
            user_role = "user"

        if server_name not in self.servers:
            logger.info("Servidor '%s' não encontrado.", server_name)
            # TODO: implementar uma maneira de obter um ARServer usando o arquivo
            #       de configs usando o 'config_manager' e 'container_id' para obter o container.
            return False

        if not self.check_access(server_name, user_role, "stop"):
            return False

        server: ARServer = self.servers[server_name]
        container: Container = server.container

        container.reload()
        if server.status != ServerStatusEnum.RUNNING:
            logger.info("Container '%s' não está em execução.", server_name)
            return True

        try:
            container.stop()
            server.update_container_status()
            logger.info("Container '%s' parado com sucesso.", server_name)
        except docker.errors.APIError as e:
            logger.info("Erro ao parar o container '%s': %s", server_name, e)
            return False

        return True

    # TODO: usar o BaseModel do pydantic para config.arserver_config
    def restart(self, server_name: str, user_role: str = "user") -> bool:
        if user_role not in self.roles:
            user_role = "user"

        if server_name not in self.servers:
            logger.info("Servidor '%s' não encontrado.", server_name)
            # TODO: implementar uma maneira de obter um ARServer usando o arquivo
            #       de configs usando o 'config_manager' e 'container_id' para obter o container.
            return False

        if not self.check_access(server_name, user_role, "restart"):
            return False

        server: ARServer = self.servers[server_name]
        container: Container = server.container

        container.reload()
        if container.status != ServerStatusEnum.RUNNING.value:
            logger.info("Container '%s' não está em execução.", server_name)
            return False

        try:
            container.restart(timeout=5)  # type: ignore
            server.update_container_status()
            logger.info("Container '%s' reiniciado com sucesso.", server_name)
        except docker.errors.APIError as e:
            logger.info("Erro ao reiniciar o container '%s': %s", server_name, e)
            return False

        return True

    def schedule_start(
        self, server_name: str, time: str, user_role: str = "user"
    ) -> bool:
        raise NotImplementedError

    def schedule_stop(
        self, server_name: str, time: str, user_role: str = "user"
    ) -> bool:
        raise NotImplementedError

    def schedule_restart(
        self, server_name: str, time: str, user_role: str = "user"
    ) -> bool:
        raise NotImplementedError

    def update_server_config(
        self, new_config: ServerConfigType, server_name: str
    ) -> bool:
        try:
            self.config_manager.update_server(server_name, new_config)
        except KeyError as e:
            logger.info("Erro ao atualizar a configuração do servidor: %s", e)
            return False
        return True

    def save_server_config(self, server_name: str) -> bool:
        if not self.config_manager.save_configs():
            logger.info("Erro ao salvar a configuração do servidor '%s'.", server_name)
            return False
        return True

    # TODO: em um futuro mais distante, separar as acões dessa função em métodos menores
    # TODO: usar o BaseModel do pydantic para config.arserver_config
    def create_server(
        self,
        server_name: str,
        ports: dict[str, int],
        config_path: str,
        dockerfile_path: str | None = None,
        custom_image_tag: str | None = None,
        command: list[str] | str | None = None,
    ) -> bool:
        """Cria um novo ArmaReforgerServer com a configuração especificada.

        Args:
            server_name (str): Nome do servidor a ser criado.
            ports (dict[str, int]): Dicionário de tipos de porta e números para vincular.
            config_path (str): Caminho para o arquivo de configuração.
            dockerfile_path (str | None, optional): Caminho para um Dockerfile personalizado para construir a imagem do servidor.
            custom_image_tag (str | None, optional): Tag para a imagem personalizada construída.
            command (list[str] | str | None, optional): Comando personalizado para executar no container.

        Returns:
            bool: True se a criação do servidor for bem-sucedida, False caso contrário.
        """
        if server_name in self.servers.items():
            logger.info("Servidor '%s' já existe.", server_name)
            return False

        # TODO: mais adiante, reduzir o escopo desse try-except para evitar capturar erros desnecessários
        try:
            container_name: str = f"{self._container_name_prefix}{server_name}"

            port_bindings: Mapping[str, int | list[int] | tuple[str, int] | None] = {}
            for port_type, port in ports.items():
                port_bindings[f"{port}/{port_type}"] = port

            command_to_use: list[str] | str = (
                command
                if command is not None
                else f"/bin/sh -c 'echo Iniciando ARServer `{server_name}` && sleep infinity'"
            )

            volume_key: str = f"{self._volumes_path}/{server_name}.volume"
            volumes: dict[str, dict[str, str]] = {
                volume_key: {"bind": f"/home/{server_name}", "mode": "rw"}
            }

            # Verifica se o container já existe e cria um novo com nome diferente, se necessário
            # TODO: talvez remover essa lógica de criar um novo container com nome diferente e apenas retornar False se o container já existir
            #       ou então criar um novo container com o mesmo nome, mas com uma tag diferente
            #       para evitar a duplicação de containers com nomes diferentes, mas que são na verdade o mesmo servidor
            #       e assim evitar a confusão de ter vários containers com nomes diferentes
            # try:
            #     if self.docker_client.containers.get(container_name):
            #         logger.info(\1)
            #         container_list: list[Container] = self.docker_client.containers.list(all=True, filters={"name": container_name})  # type: ignore
            #         index: int = len(container_list) + 1  # type: ignore
            #         container_name = f"{container_name}_{index}"
            # except docker.errors.NotFound:
            #     pass

            # Determina qual imagem usar: construída a partir de um Dockerfile personalizado ou padrão
            image_to_use = self.default_arserver_image + ":latest"
            if dockerfile_path is not None:
                custom_tag = (
                    custom_image_tag
                    if custom_image_tag is not None
                    else f"custom_arserver_{server_name}:latest"
                )
                if self.build_dockerfile(dockerfile_path, custom_tag):
                    image_to_use = custom_tag
                    logger.info(
                        "Container '%s' já existe. Criando novo com nome diferente.",
                        container_name,
                    )
                else:
                    logger.info(
                        "Falha ao construir imagem personalizada, voltando para a imagem padrão '%s'.",
                        image_to_use,
                    )
            else:
                if image_to_use not in [
                    img.tags[0] for img in self.docker_client.images.list() if img.tags
                ]:  # type: ignore
                    self.pull_container_image(
                        repository=self.default_arserver_image, tag="latest"
                    )
                    logger.info("Imagem padrão '%s' baixada.", image_to_use)

            try:
                container: Container | None = self.docker_client.containers.get(
                    container_name
                )
            except docker.errors.NotFound:
                container = None

            if not container:
                logger.info(
                    "Container '%s' não encontrado, criando novo.", container_name
                )
                container = self.docker_client.containers.create(
                    image=image_to_use,
                    command=command_to_use,
                    cpu_count=self.cpu_count,
                    cpu_percent=self.cpu_percent,
                    name=container_name,
                    ports=port_bindings,
                    volumes=volumes,
                    detach=True,
                )

                if container.status != ServerStatusEnum.CREATED.value:
                    logger.info("Falha ao criar o container '%s'.", container_name)
                    return False

            logger.info("Container '%s' criado com sucesso.", container_name)

            try:
                server_config: ARServerConfigType | None = (
                    self.config_manager.get_server(server_name).arserver_config
                )
            except KeyError:
                server_config = None

            if not server_config:
                logger.info("Instanciando configuração do servidor '%s'.", server_name)
                server_config = ARServerConfigType(
                    server_name=server_name,
                    profile_path=f"{self.profiles_path}/{server_name}",
                    ports=ports,
                    arserver_bin="arserver",
                    arserver_bin_path="/usr/local/bin/arserver",
                    arserver_config_path=f"{config_path}/arserver.conf",
                    container_id=container.id,
                )

            logger.info(
                "Configuração do servidor '%s' instanciada com sucesso.", server_name
            )
            logger.info("%s", server_config.__repr__())

            try:
                server: ARServer | None = self.servers.get(server_name)
            except KeyError:
                server = None

            if not server:
                logger.info(
                    "Instanciando o servidor '%s' com a configuração fornecida.",
                    server_name,
                )
                server = ARServer(
                    server_name=server_name,
                    server_config=server_config,
                    container=container,
                    status=ServerStatusEnum.CREATED,
                )

            logger.info("Servidor '%s' instanciado com sucesso.", server_name)
            logger.info("%s", server.__repr__())

            if not self.config_manager.has_server(server_name):
                logger.info(
                    "Adicionando configuração do servidor '%s' ao config_manager.",
                    server_name,
                )
                self.config_manager.add_server(
                    server_name=server_name,
                    config=ServerConfigType(
                        server_name=server_name, arserver_config=server_config
                    ),
                )

            self.servers.update({server_name: server})
            logger.info("Servidor '%s' adicionado à lista de servidores.", server_name)

            self.save_server_config(server_name=server_name)
            logger.info("Configuração do servidor '%s' salva com sucesso.", server_name)

            logger.info("Servidor '%s' criado com sucesso.", server_name)
            return True
        except docker.errors.ImageNotFound:
            logger.info("Imagem '%s' não encontrada.", self.default_arserver_image)
            return False
        except docker.errors.APIError as e:
            logger.info("Erro ao criar o servidor: %s", e)
            return False

    # TODO: usar o BaseModel do pydantic para config.arserver_config
    def remove_server(
        self, server_name: str, user_role: str = "user", remove_volumes: bool = False
    ) -> bool:
        if not self.check_access(server_name, user_role, "delete"):
            return False

        # TODO: padronizar essa lógica para obter um ARServer de uma config em 'start', 'stop' e 'restart'.
        if server_name not in self.servers:
            if not self.config_manager.get_server(server_name):
                logger.info("Servidor '%s' não encontrado.", server_name)
                return False

        # TODO: padronizar essa lógica para obter um ARServer de uma config em 'start', 'stop' e 'restart'.
        try:
            server: ARServer = self.servers[server_name]
        except KeyError:
            config = self.config_manager.get_server(server_name)

            # TODO: preferir não gerar nenhuma exception com raise, usar 'return False' invés disso.
            if not hasattr(config, "arserver_config"):
                raise ValueError(
                    f"Esperado ServerConfigType com arserver_config para o servidor '{server_name}'"
                )
            server = ARServer(
                server_name=server_name,
                server_config=config.arserver_config,
                container=self.docker_client.containers.get(
                    f"{self._container_name_prefix}{server_name}"
                ),
                status=ServerStatusEnum.CREATED,
            )

        container: Container = server.container

        container.reload()
        if container.status == ServerStatusEnum.RUNNING.value:
            logger.info("Parando o servidor '%s' antes de remover.", server_name)
            self.stop(server_name)
        try:
            container.remove(force=True, v=remove_volumes)
            logger.info("Container '%s' removido com sucesso.", server_name)

            del self.servers[server_name]
            logger.info("Servidor '%s' removido da lista de servidores.", server_name)

            self.config_manager.remove_server(server_name)
            logger.info(
                "Configuração do servidor '%s' removida com sucesso.", server_name
            )

            self.save_server_config(server_name)
            logger.info(
                "Configuração do servidor '%s' salva após remoção.", server_name
            )

            logger.info("Servidor '%s' removido com sucesso.", server_name)
        except docker.errors.NotFound:
            logger.info("Container '%s' não encontrado.", server_name)
            return False
        except docker.errors.APIError as e:
            logger.info("Erro ao remover o servidor '%s': %s", server_name, e)
            return False
        return True
