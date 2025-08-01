import enum


class EnumARServerStatus(enum.Enum):
    RUNNING = "running"
    CREATED = "created"
    EXITED = "exited"
    PAUSED = "paused"
    RESTARTING = "restarting"
    REMOVING = "removing"
    DEAD = "dead"
