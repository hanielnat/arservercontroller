from ipaddress import IPv4Address
from typing import Optional

from pydantic import UUID4, BaseModel, IPvAnyAddress, field_serializer

from arservercontroller.constants import SERVER_SCHEMA_VERSION, ServerStatusEnum


class ServerConfigBase(BaseModel):
    version: str = SERVER_SCHEMA_VERSION
    name: str
    bind_port: int
    bind_address: Optional[IPvAnyAddress] = None
    a2s_port: Optional[int] = None
    rcon_port: Optional[int] = None
    status: ServerStatusEnum
    arserver_profile_path: str
    arserver_config_path: str

    @field_serializer("bind_address", when_used="json")
    def serialize_bind_address(self, bind_address: IPv4Address) -> Optional[str]:
        return str(bind_address) if bind_address else None

    @field_serializer("status", when_used="json")
    def serialize_status(self, status: ServerStatusEnum) -> str:
        return status.value


class ServerConfigCreate(ServerConfigBase):
    pass


class ServerConfigUpdate(ServerConfigBase):
    pass


class ServerConfig(ServerConfigBase):
    id: UUID4
    container_id: UUID4

    @field_serializer("id", when_used="json")
    def serialize_id(self, id: UUID4) -> str:
        return str(id)

    @field_serializer("container_id", when_used="json")
    def serialize_container_id(self, container_id: UUID4) -> str:
        return str(container_id)
