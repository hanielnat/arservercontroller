from pydantic import (
    AliasGenerator,
    BaseModel,
    ConfigDict,
)
from pydantic.alias_generators import to_camel

from arservercontroller.schemas.server_config import (
    ServerConfig,
)


class BaseServer(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=AliasGenerator(
            serialization_alias=to_camel, validation_alias=to_camel
        ),
    )


class ServerOut(BaseServer):
    created_at: int
    updated_at: int
    server_config_data: ServerConfig


class ServersOut(BaseServer):
    data: list[ServerOut]
    count: int
