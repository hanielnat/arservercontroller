from dataclasses import dataclass
from enum import Flag, StrEnum, auto
from ipaddress import IPv4Address
from pathlib import Path

from pydantic import BaseModel, ConfigDict, IPvAnyAddress

import arservercontroller

CONTAINER_NAME_PREFIX: str = "arserver_"
SERVER_SCHEMA_VERSION: str = "0.0.1"

BIND_IP_AUTOMATIC: IPvAnyAddress = IPv4Address("0.0.0.0")
RCON_IP_AUTOMATIC: IPvAnyAddress = IPv4Address("0.0.0.0")
DEFAULT_BIND_IP: IPvAnyAddress = IPv4Address("127.0.0.1")
DEFAULT_RCON_IP: IPvAnyAddress = IPv4Address("127.0.0.1")
DEFAULT_BIND_PORT: int = 2001
DEFAULT_A2S_PORT: int = 1_9999
DEFAULT_RCON_PORT: int = 1_7777
PROTOCOL_BIND_PORT: str = "udp"
PROTOCOL_A2S_PORT: str = "udp"
PROTOCOL_RCON_PORT: str = "tcp"


class BaseDirectories(BaseModel):
    """Base directories for the ARServerController module on the host system."""

    model_config = ConfigDict(frozen=True)

    MODULE_DIR: Path  # ../arservercontroller
    ROOT_DIR: Path  # ../backend/arservercontroller
    DATA_DIR: Path  # ../backend/arservercontroller/data
    LOGS_DIR: Path  # ../backend/arservercontroller/data/logs
    DB_DIR: Path  # ../backend/arservercontroller/data/db

    @classmethod
    def create(cls) -> "BaseDirectories":
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
    DS_CONFIGS_DIR: Path  # ../data/controller/ds_configs
    DS_PROFILES_DIR: Path  # ../data/controller/profiles
    CONTAINER_VOLUMES_DIR: Path  # ../data/controller/volumes
    CONTAINER_IMAGES_DIR: Path  # ../data/controller/dockerfiles

    @classmethod
    def create_from_base(cls, base: BaseDirectories) -> "ControllerDirectories":
        """Factory method to create ControllerDirectories using base directories."""
        controller_dir = base.DATA_DIR / "controller"
        ds_configs_dir = controller_dir / "ds_configs"
        ds_profiles_dir = controller_dir / "profiles"
        container_volumes_dir = controller_dir / "volumes"
        container_images_dir = controller_dir / "dockerfiles"
        return cls(
            **base.model_dump(),
            CONTROLLER_DIR=controller_dir,
            DS_CONFIGS_DIR=ds_configs_dir,
            DS_PROFILES_DIR=ds_profiles_dir,
            CONTAINER_VOLUMES_DIR=container_volumes_dir,
            CONTAINER_IMAGES_DIR=container_images_dir,
        )


class ContainerDirectories(BaseModel):
    """Directories and paths inside the container, dynamic per server."""

    model_config = ConfigDict(frozen=True)

    CONTAINER_DATA_DIR: Path  # /data
    CONTAINER_CONTROLLER_DIR: Path  # /data/controller
    CONTAINER_PROFILE_DIR: Path  # /home/{server_name}
    CONTAINER_CONFIG_FILE: Path  # /home/{server_name}/config.json
    CONTAINER_REFORGER_ADDONS_DIR: Path  # /home/{server_name}/addons
    CONTAINER_REFORGER_LOGS_DIR: Path  # /home/{server_name}/logs
    CONTAINER_REFORGER_DIR: Path  # /reforger
    CONTAINER_REFORGER_BIN: Path  # /reforger/ArmaReforgerServer
    CONTAINER_STEAMCMD_DIR: Path  # /steamcmd
    CONTAINER_STEAMCMD_BIN: Path  # /steamcmd/steamcmd.sh

    @classmethod
    def create(cls, server_name: str) -> "ContainerDirectories":
        """Factory method to create ContainerDirectories for a specific server."""
        container_data_dir = Path("/data")
        container_controller_dir = container_data_dir / "controller"
        container_profile_dir = Path(f"/home/{server_name}")
        container_config_file = container_profile_dir / "config.json"
        container_reforger_addons_dir = container_profile_dir / "addons"
        container_reforger_logs_dir = container_profile_dir / "logs"
        container_reforger_dir = Path("/reforger")
        container_reforger_bin = container_reforger_dir / "ArmaReforgerServer"
        container_steamcmd_dir = Path("/steamcmd")
        container_steamcmd_bin = container_steamcmd_dir / "steamcmd.sh"
        return cls(
            CONTAINER_DATA_DIR=container_data_dir,
            CONTAINER_CONTROLLER_DIR=container_controller_dir,
            CONTAINER_PROFILE_DIR=container_profile_dir,
            CONTAINER_CONFIG_FILE=container_config_file,
            CONTAINER_REFORGER_ADDONS_DIR=container_reforger_addons_dir,
            CONTAINER_REFORGER_LOGS_DIR=container_reforger_logs_dir,
            CONTAINER_REFORGER_DIR=container_reforger_dir,
            CONTAINER_REFORGER_BIN=container_reforger_bin,
            CONTAINER_STEAMCMD_DIR=container_steamcmd_dir,
            CONTAINER_STEAMCMD_BIN=container_steamcmd_bin,
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

    def get_container_directories(self, server_name: str) -> ContainerDirectories:
        """Get container directories for a specific server."""
        return ContainerDirectories.create(server_name)


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
