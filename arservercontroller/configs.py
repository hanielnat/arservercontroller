import json
import os
from typing import Dict, List

from arservercontroller.logger import get_logger

logger = get_logger()


# TODO: converter para BaseModel do pydantic
class ARServerConfigType:
    def __init__(
        self,
        server_name: str,
        profile_path: str,
        arserver_config_path: str,
        ports: Dict[str, int],
        arserver_bin: str,
        arserver_bin_path: str,
        container_id: str | None,
    ):
        self.server_name = server_name
        self.profile_path = profile_path
        self.arserver_config_path = arserver_config_path
        self.ports = ports
        self.arserver_bin = arserver_bin
        self.arserver_bin_path = arserver_bin_path
        self.container_id = container_id


# TODO: converter para BaseModel do pydantic
class ServerConfigType:
    def __init__(self, server_name: str, arserver_config: ARServerConfigType):
        self.server_name = server_name
        self.arserver_config = arserver_config


# TODO: converter operações em arquivos para usar o sqlalchemy
class ServerConfigManager:
    def __init__(
        self,
        base_configs_path: str = "/usr/local/share/arserver-controller/config-manager",
        base_configs_file: str = "serverConfigs.json",
    ) -> None:
        self.base_configs_path: str = base_configs_path
        self.base_configs_file: str = base_configs_file
        self.initialize_directories()
        self.configs: Dict[str, List[ServerConfigType]] = {}
        self.load_configs()

    def _get_base_config_path(self) -> str:
        """Retorna o caminho do arquivo de configuração."""
        return os.path.abspath(self.base_configs_path)

    def _get_base_config_file(self) -> str:
        """Retorna o nome do arquivo de configuração."""
        return self.base_configs_file

    def _get_config_path_for_server(self, server_name: str) -> str:
        """Retorna o caminho do arquivo de configuração para um servidor específico."""
        return os.path.join(self._get_base_config_path(), f"{server_name}.json")

    def load_configs(self) -> None:
        """Carrega as configurações do arquivo JSON."""
        path: str = self.get_configs_file()

        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as _:
                try:
                    # result: str = file.read()
                    # TODO: chamar validate json
                    pass
                except json.JSONDecodeError as e:
                    logger.info(
                        "Erro ao decodificar o arquivo JSON: %s. O arquivo pode estar corrompido.",
                        e,
                    )
                    self.configs = {}
        else:
            self.configs = {}

    def initialize_directories(self) -> bool:
        """Inicializa o diretório base para as configurações, se não existir."""
        try:
            os.makedirs(self._get_base_config_path(), exist_ok=True)
            logger.info(
                "Diretório de configurações criado em: %s", self._get_base_config_path()
            )
        except OSError as e:
            logger.info("Erro ao criar diretório de configurações: %s", e)
            return False
        return True

    def get_configs_file(self) -> str:
        """Retorna o caminho completo do arquivo de configuração."""
        return f"{self._get_base_config_path()}/{self._get_base_config_file()}"

    def save_configs(self) -> bool:
        """Salva as configurações no arquivo JSON."""
        with open(file=self.get_configs_file(), mode="w", encoding="utf-8") as _:
            try:
                # TODO: chamar BaseModel.model_dump_json()
                pass
            except TypeError as e:
                logger.error(
                    "Erro ao serializar as configurações: %s. Verifique se os dados são serializáveis.",
                    e,
                )
                return False
            return True

    def remove_configs(self) -> None:
        """Remove todas as configurações salvas."""
        self.configs = {}
        try:
            os.remove(self.get_configs_file())
            logger.info(
                "Arquivo de configurações removido: %s", self.get_configs_file()
            )
        except OSError as e:
            logger.error("Erro ao remover o arquivo de configurações: %s", e)

    def has_server(self, server_name: str) -> bool:
        """Verifica se uma configuração de servidor existe."""
        return server_name in self.configs

    def add_server(self, server_name: str, config: ServerConfigType) -> None:
        """Adiciona uma nova configuração de servidor."""
        self.configs.setdefault(server_name, [])
        self.configs[server_name].append(config)

    def update_server(self, server_name: str, config: ServerConfigType) -> None:
        """Atualiza a configuração de um servidor existente."""
        if server_name in self.configs:
            for i, existing_config in enumerate(self.configs[server_name]):
                if existing_config.server_name != config.server_name:
                    continue
                self.configs[server_name][i] = config
                break
        else:
            raise KeyError(f"Servidor '{server_name}' não encontrado.")

    def get_server(self, server_name: str) -> ServerConfigType:
        """Obtém a configuração de um servidor específico."""
        if server_name in self.configs:
            return self.configs[server_name][0]
        raise KeyError(f"Servidor '{server_name}' não encontrado.")

    def remove_server(self, server_name: str) -> None:
        """Remove a configuração de um servidor."""
        if server_name in self.configs:
            del self.configs[server_name]

    def list_servers(self) -> Dict[str, List[ServerConfigType]]:
        """Lista todas as configurações de servidores."""
        return self.configs
