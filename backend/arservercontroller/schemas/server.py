from pydantic import (
    BaseModel,
    ConfigDict,
)
from pydantic.alias_generators import to_camel

from arservercontroller.constants import ServerStatusEnum
from arservercontroller.schemas.server_config import ServerConfig


class BaseServer(BaseModel):
    model_config = ConfigDict(
        from_attributes=True, populate_by_name=True, alias_generator=to_camel
    )


class ServerOut(BaseServer):
    created_at: int
    updated_at: int
    server_config_data: ServerConfig


class ServersOut(BaseServer):
    data: list[ServerOut]
    count: int


class ReforgerProcessStatusOut(BaseModel):
    model_config = ConfigDict(
        from_attributes=True, populate_by_name=True, alias_generator=to_camel
    )

    pid: int | None
    status: ServerStatusEnum


class ServerStatusOut(BaseServer):
    container: ServerStatusEnum
    agent: ServerStatusEnum
    reforger: ReforgerProcessStatusOut
