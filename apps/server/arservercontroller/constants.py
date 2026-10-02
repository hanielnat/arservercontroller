from enum import Flag, StrEnum, auto

AGENT_CONTAINER_NETWORK_NAME: str = "arserver-net"
DEFAULT_CONTAINER_IMAGE_NAME: str = "arserver:latest"
DEFAULT_TEST_CONTAINER_IMAGE_NAME: str = "arserver-mock:latest"
SERVER_SCHEMA_VERSION: str = "0.0.1"


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
