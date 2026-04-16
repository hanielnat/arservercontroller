import os
from pathlib import Path
from typing import Annotated

import anyio
from fastapi import Depends
from pydantic import UUID4, ValidationError

from arservercontroller.api.dependencies import DbSessionDep
from arservercontroller.constants import directory_manager
from arservercontroller.db.models.server import Server
from arservercontroller.schemas.server_config import (
    ServerConfig,
)
from arservercontroller.services.logger import get_logger
from arservercontroller.utils.errors import Result

logger = get_logger(__name__)


# TODO: padronizar código de erros
class ServerConfigManagerV2:
    def __init__(self, db: DbSessionDep) -> None:
        self._db = db
        self._watched_files: dict[UUID4, Path] = {}

    async def _save_config_file(
        self, config: ServerConfig
    ) -> Result[bool, IOError | OSError | ValidationError]:
        path = (
            directory_manager.controller_directories.DS_CONFIGS_DIR
            / f"{config.id}.json"
        )
        try:
            async with await anyio.open_file(path, mode="w", encoding="utf-8") as f:
                json_str = config.model_dump_json(indent=4)
                await f.write(json_str)

        except (IOError, OSError) as e:
            logger.exception(e)
            return Result.fail(e)

        return Result.success(True)

    async def _load_config_file(
        self, id: UUID4
    ) -> Result[ServerConfig, IOError | OSError | ValidationError]:
        path = directory_manager.controller_directories.DS_CONFIGS_DIR / f"{id}.json"
        result: ServerConfig

        try:
            async with await anyio.open_file(path, mode="r", encoding="utf-8") as f:
                json_str = await f.read()
                result = ServerConfig.model_validate_json(json_str)

        except (IOError, OSError, ValidationError) as e:
            logger.exception(e)
            return Result.fail(e)

        return Result.success(result)

    def _add_to_watched(self, id: UUID4, config_path: Path):
        self._watched_files[id] = config_path

    def _remove_from_watched(self, id: UUID4):
        if id in self._watched_files:
            del self._watched_files[id]

    # FIXME: carregar as alterações do arquivo primeiro antes de salvar
    # TODO: add watch em todos os arquivos dentro da pasta DS_CONFIGS_DIR
    # TODO: usar lifespan do fastapi inves de chamar essa função nos endpoints
    async def watch(self, config: ServerConfig, sleep: float = 1.0) -> None:
        config_path = (
            directory_manager.controller_directories.DS_CONFIGS_DIR
            / f"{config.id}.json"
        )
        last_update = os.path.getmtime(config_path)

        logger.debug("Watching config file for ID '%s'", config.id)
        self._add_to_watched(config.id, config_path)
        while True:
            current_update = os.path.getmtime(config_path)
            if current_update == last_update:
                continue

            logger.debug("Detected file change at '%s'", config_path)

            saved = await self.save_db(config)
            if not saved.is_ok():
                logger.error("Error saving watched config file for ID '%s'", config.id)
                logger.exception(saved.error())
                return

            last_update = current_update
            logger.debug("Done saving watched file changes of ID '%s'", config.id)
            await anyio.sleep(sleep)

    async def save_db(
        self, config: ServerConfig
    ) -> Result[bool, Exception | OSError | ValidationError]:
        model = self._db.get(Server, config.id)
        if not model:
            return Result.fail(
                RuntimeError("Server config must exist in DB to be saved to a file")
            )

        if not model.serverConfigData:
            return Result.fail(
                AttributeError(
                    "Server DB model of ID '%s' must have a 'server_config_data' object to be saved to a file, it is 'None'"
                    % model.id
                )
            )
        saved = await self._save_config_file(model.serverConfigData)
        if not saved.is_ok():
            logger.error("Can't save config file with ID '%s'", model.id)
            logger.exception(saved.error())
            return Result.fail(saved.error())

        return Result.success(saved.value())

    async def load_db(
        self, id: UUID4
    ) -> Result[bool, RuntimeError | OSError | ValidationError]:
        model = self._db.get(Server, id)
        if not model:
            msg = f"Model not found with ID {id}"
            logger.warning(msg)
            return Result.fail(RuntimeError(msg))

        config = await self._load_config_file(id)
        if not config.is_ok():
            msg = f"Can't load config file with ID {id}"
            logger.error(msg)
            logger.exception(config.error())
            return Result.fail(config.error())

        model.serverConfigData = config.value()
        self._db.refresh(model)
        self._db.commit()
        logger.debug("Sync done for server config with ID '%s'", model.id)
        return Result.success(True)

    async def save_config(
        self, config: ServerConfig
    ) -> Result[bool, IOError | ValidationError]:
        result = await self._save_config_file(config)
        if not result.is_ok():
            return Result.fail(result.error())

        return Result.success(True)

    async def load_config(
        self,
        id: UUID4,
    ) -> Result[
        ServerConfig, FileNotFoundError | PermissionError | ValidationError | OSError
    ]:
        config = await self._load_config_file(id)
        if not config.is_ok():
            return Result.fail(config.error())

        logger.debug("Loaded json config file for ID = %s" % id)
        return Result.success(config.value())

    def load_configs(self) -> list[ServerConfig]:
        result: list[ServerConfig] = []
        config_paths = directory_manager.controller_directories.DS_CONFIGS_DIR.glob(
            "*.json"
        )

        for config_file_path in config_paths:
            try:
                result.append(
                    ServerConfig.model_validate_json(
                        config_file_path.read_text("utf-8")
                    )
                )
            except (FileNotFoundError, PermissionError, ValidationError, OSError) as e:
                logger.exception(e)
                continue

        return result


def get_server_config_manager(db: DbSessionDep) -> ServerConfigManagerV2:
    return ServerConfigManagerV2(db)


ServerConfigMangerDep = Annotated[
    ServerConfigManagerV2, Depends(get_server_config_manager)
]
