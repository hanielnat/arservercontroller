from pydantic import (
    UUID4,
    BaseModel,
    ConfigDict,
    Field,
    field_serializer,
)

from arservercontroller.constants import SERVER_SCHEMA_VERSION
from arservercontroller.schemas.server_config import (
    ServerConfig,
    ServerConfigCreate,
    ServerConfigUpdate,
)


class BaseServer(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    version: str = Field(
        description="JSON schema version.", default=SERVER_SCHEMA_VERSION
    )


class ServerCreate(BaseServer):
    name: str
    created_at: int
    server_config_data: ServerConfigCreate


class ServerUpdate(BaseServer):
    updated_at: int
    server_config_data: ServerConfigUpdate


class ServerOut(BaseServer):
    id: UUID4
    name: str
    server_config_data: ServerConfig

    @field_serializer("id", when_used="json")
    def serialize_id(self, id: UUID4) -> str:
        return str(id)


class ServersOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    data: list[ServerOut]
    count: int
