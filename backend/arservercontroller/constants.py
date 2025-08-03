import enum
from pathlib import Path

from pydantic import BaseModel

import arservercontroller


class BaseDirectories(BaseModel):
    MODULE_DIR: Path = Path(arservercontroller.__file__).parent
    ROOT_DIR: Path = MODULE_DIR.parent
    DATA_DIR: Path = ROOT_DIR / "data"
    LOGS_DIR: Path = DATA_DIR / "logs"


class ControllerDirectories(BaseDirectories):
    def __init__(self, /, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.CONTROLLER_DIR = self.DATA_DIR / "controller"
        self.DS_CONFIGS_DIR: Path = self.CONTROLLER_DIR / "ds_configs"
        self.DS_PROFILES_DIR: Path = self.CONTROLLER_DIR / "profiles"
        self.CONTAINER_VOLUMES_DIR: Path = self.CONTROLLER_DIR / "volumes"


class EnumARServerStatus(enum.Enum):
    RUNNING = "running"
    CREATED = "created"
    EXITED = "exited"
    PAUSED = "paused"
    RESTARTING = "restarting"
    REMOVING = "removing"
    DEAD = "dead"
