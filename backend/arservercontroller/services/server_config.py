import json
import os
from pathlib import Path
from typing import Optional

from arservercontroller.constants import directory_manager
from arservercontroller.db.models.server import Server
from arservercontroller.db.models.server_configs import ServerConfigType
from arservercontroller.schemas.server_config import (
    ServerConfig,
    ServerConfigBase,
)
from arservercontroller.services.logger import get_logger
from pydantic import UUID4, ValidationError
from sqlalchemy.orm import Session

logger = get_logger(__name__)


class ServerConfigManagerV2:
    def __init__(self, db: Session) -> None:
        self._db = db

    def save_db(self, id: UUID4) -> None:
        model = self._db.get(Server, id)
        if not model:
            raise

        try:
            config = ServerConfig.model_validate(model.server_config_data)
            ServerConfigManagerV2.save_config(config)

        except Exception as e:
            raise Exception from e

    def load_db(self, id: UUID4) -> Optional[ServerConfig]:
        try:
            out_config = ServerConfigManagerV2.load_config(id)
        except Exception:
            return None

        return out_config

    @staticmethod
    def initialize_directories() -> bool:
        try:
            Path.mkdir(
                directory_manager.controller_directories.DS_CONFIGS_DIR, exist_ok=True
            )

        except OSError as e:
            logger.exception(e)
            return False

        return True

    @staticmethod
    def save_config(config: ServerConfig) -> bool:
        ok: bool = True

        try:
            with open(
                directory_manager.controller_directories.DS_CONFIGS_DIR
                / f"{str(config.id)}.json",
                mode="w",
            ) as file:
                file.write(config.model_dump_json())
                return ok

        except OSError as e:
            logger.exception(e)

        finally:
            return not ok

    @staticmethod
    def load_configs() -> list[ServerConfigBase]:
        result_list: list[ServerConfigBase] = []
        result_config: ServerConfigBase

        for config_file in os.listdir(
            directory_manager.controller_directories.DS_CONFIGS_DIR
        ):
            if not config_file.endswith(".json"):
                continue

            try:
                with open(
                    directory_manager.controller_directories.DS_CONFIGS_DIR
                    / f"{config_file}"
                ) as config:
                    result_config = ServerConfigBase.model_validate_json(
                        json.loads(config.read())
                    )
                    result_list.append(result_config)
            except (OSError, FileNotFoundError, PermissionError, ValidationError) as e:
                logger.exception(e)
                continue
        return []

    @staticmethod
    def load_config(server_id: UUID4) -> Optional[ServerConfig]:
        try:
            result_config: ServerConfig
            with open(
                directory_manager.controller_directories.DS_CONFIGS_DIR
                / f"{str(server_id)}.json"
            ) as config:
                result_config = ServerConfig.model_validate_json(
                    json.loads(config.read())
                )
                logger.debug("loaded json config file for server_id = %s" % server_id)

            return result_config
        except (OSError, FileNotFoundError, PermissionError, ValidationError) as e:
            logger.exception(e)
            return None


# TODO: converter operações em arquivos para usar o sqlalchemy
class ServerConfigManager:
    def __init__(
        self,
        base_configs_path: Path = directory_manager.controller_directories.DS_CONFIGS_DIR,
        base_configs_file: str = "server_configs.json",
    ) -> None:
        self.base_configs_path: Path = base_configs_path
        self.base_configs_file: str = base_configs_file
        self.initialize_directories()
        self.configs: dict[str, list[ServerConfigType]] = {}
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

    def list_servers(self) -> dict[str, list[ServerConfigType]]:
        """Lista todas as configurações de servidores."""
        return self.configs
