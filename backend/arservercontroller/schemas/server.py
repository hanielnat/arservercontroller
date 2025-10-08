from pydantic import (
    BaseModel,
    ConfigDict,
)

from arservercontroller.schemas.server_config import (
    ServerConfig,
)


class BaseServer(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ServerOut(BaseServer):
    created_at: int
    updated_at: int
    server_config_data: ServerConfig


class ServersOut(BaseServer):
    data: list[ServerOut]
    count: int
