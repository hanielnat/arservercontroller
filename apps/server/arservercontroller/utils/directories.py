from logging import Logger
from pathlib import Path
from typing import cast

from arservercontroller.core.config import get_directories


def _mkdir(directories: list[Path], logger: Logger):
    for path in directories:
        if path.exists():
            continue

        try:
            logger.debug("Creating directory: '%s'" % path)
            Path.mkdir(path, parents=True, exist_ok=True)
        except OSError as e:
            logger.error("Error creating directory: '%s'" % path)
            logger.exception(e)


def make_directories(logger: Logger):
    base_dirs = get_directories().model_dump()
    _mkdir(cast(list[Path], base_dirs.values()), logger)
