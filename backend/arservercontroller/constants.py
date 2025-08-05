import enum
from pathlib import Path

from pydantic import BaseModel, computed_field

import arservercontroller


class BaseDirectories(BaseModel):
    MODULE_DIR: Path = Path(arservercontroller.__file__).parent
    ROOT_DIR: Path = MODULE_DIR.parent
    DATA_DIR: Path = ROOT_DIR / "data"
    LOGS_DIR: Path = DATA_DIR / "logs"


class ControllerDirectories(BaseDirectories):
    @computed_field
    @property
    def CONTROLLER_DIR(self) -> Path:
        return self.DATA_DIR / "controller"

    DS_CONFIGS_DIR: Path = Path(f"{CONTROLLER_DIR}/ds_configs")
    DS_PROFILES_DIR: Path = Path(f"{CONTROLLER_DIR}/profiles")
    CONTAINER_VOLUMES_DIR: Path = Path(f"{CONTROLLER_DIR}/volumes")


class EnumARServerStatus(enum.Enum):
    RUNNING = "running"
    CREATED = "created"
    EXITED = "exited"
    PAUSED = "paused"
    RESTARTING = "restarting"
    REMOVING = "removing"
    DEAD = "dead"
