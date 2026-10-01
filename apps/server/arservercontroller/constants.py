from dataclasses import dataclass
from enum import Flag, StrEnum, auto
from pathlib import Path

from pydantic import BaseModel, ConfigDict

import arservercontroller

AGENT_CONTAINER_NETWORK_NAME: str = "arserver-net"
SERVER_SCHEMA_VERSION: str = "0.0.1"


class BaseDirectories(BaseModel):
    """Base directories for the ARServerController module on the host system."""

    model_config = ConfigDict(frozen=True)

    MODULE_DIR: Path  # ../arservercontroller
    ROOT_DIR: Path  # ../backend/arservercontroller
    DATA_DIR: Path  # ../backend/arservercontroller/data
    LOGS_DIR: Path  # ../backend/arservercontroller/data/logs
    DB_DIR: Path  # ../backend/arservercontroller/data/db

    @classmethod
    def create(cls) -> BaseDirectories:
        """Factory method to create BaseDirectories with computed paths."""
        module_dir = Path(arservercontroller.__file__).parent
        root_dir = module_dir.parent
        data_dir = root_dir / "data"
        logs_dir = data_dir / "logs"
        db_dir = data_dir / "db"
        return cls(
            MODULE_DIR=module_dir,
            ROOT_DIR=root_dir,
            DATA_DIR=data_dir,
            LOGS_DIR=logs_dir,
            DB_DIR=db_dir,
        )


class ControllerDirectories(BaseDirectories):
    """Directories for controller-specific paths on the host system."""

    CONTROLLER_DIR: Path  # ../data/controller
    DS_PROFILES_DIR: Path  # ../data/controller/profiles

    @classmethod
    def create_from_base(cls, base: BaseDirectories) -> ControllerDirectories:
        """Factory method to create ControllerDirectories using base directories."""
        controller_dir = base.DATA_DIR / "controller"
        ds_profiles_dir = controller_dir / "profiles"
        return cls(
            **base.model_dump(),
            CONTROLLER_DIR=controller_dir,
            DS_PROFILES_DIR=ds_profiles_dir,
        )


@dataclass
class DirectoryManager:
    """Manages host directories for ARServerController; container dirs are dynamic per server."""

    base_directories: BaseDirectories
    controller_directories: ControllerDirectories

    def __init__(self):
        self.base_directories = BaseDirectories.create()
        self.controller_directories = ControllerDirectories.create_from_base(
            self.base_directories
        )


directory_manager: DirectoryManager = DirectoryManager()


class ServerStatusEnum(StrEnum):
    RUNNING = auto()
    CREATED = auto()
    EXITED = auto()
    PAUSED = auto()
    RESTARTING = auto()
    REMOVING = auto()
    DEAD = auto()


class UserRoles(StrEnum):
    ADMIN = auto()
    MODERATOR = auto()
    USER = auto()


class RolePermissions(Flag):
    READ_SERVERS = auto()
    WRITE_SERVERS = auto()
    READ_USERS = auto()
    WRITE_USERS = auto()

    RW_SERVERS = READ_SERVERS | WRITE_SERVERS
    RW_USERS = READ_USERS | WRITE_USERS
    RW_ALL = RW_SERVERS | RW_USERS
