import enum
import pathlib
from pathlib import Path

from pydantic import BaseModel

import arservercontroller


class BaseDirectories(BaseModel):
    MODULE_DIR: Path = pathlib.Path(arservercontroller.__file__)
    ROOT_DIR: Path = MODULE_DIR.parent
    DATA_DIR: Path = ROOT_DIR / "data"
    LOGS_DIR: Path = ROOT_DIR / "logs"


class ControllerDirectories(BaseDirectories):
    CONTROLLER_DIR: Path = BaseDirectories.DATA_DIR / "controller"
    DS_CONFIGS_DIR: Path = CONTROLLER_DIR / "ds_configs"
    DS_PROFILES_DIR: Path = CONTROLLER_DIR / "profiles"
    CONTAINER_VOLUMES_DIR: Path = CONTROLLER_DIR / "volumes"


class EnumARServerStatus(enum.Enum):
    RUNNING = "running"
    CREATED = "created"
    EXITED = "exited"
    PAUSED = "paused"
    RESTARTING = "restarting"
    REMOVING = "removing"
    DEAD = "dead"
