import uuid
from ipaddress import IPv4Address
from typing import Annotated, Optional

from arservercontroller.constants import SERVER_SCHEMA_VERSION, ServerStatusEnum
from docker.models.containers import Container
from pydantic import (
    UUID4,
    BaseModel,
    Field,
    IPvAnyAddress,
    field_validator,
)


class ServerConfigBase(BaseModel):
    # fmt: off
    version: Annotated[
        str, Field(default=SERVER_SCHEMA_VERSION)
    ]

    name: Annotated[
        str, Field(min_length=4, max_length=20)
    ]

    bind_port: Annotated[
        int, Field(default=2001, gt=0, lt=63535)
    ]

    bind_address: Annotated[
        Optional[IPvAnyAddress], Field(default=IPv4Address("0.0.0.0"))
    ]

    a2s_port: Annotated[
        Optional[int], Field(default=17777, gt=0, lt=63535)
    ]

    rcon_port: Annotated[
        Optional[int], Field(default=19999, gt=0, lt=63535)
    ]

    status: Annotated[
        ServerStatusEnum, Field(default=ServerStatusEnum.DEAD, exclude=True)
    ]

    command_line: Annotated[
        Optional[list[str] | str], Field(default=None)
    ]

    arserver_profile_path: Annotated[
        Optional[str], Field(default=None)
    ]

    arserver_config_path: Annotated[
        Optional[str], Field(default=None)
    ]
    # fmt: on

    @classmethod
    @field_validator("version")
    def schema_version(cls, v: str) -> str:
        if v != SERVER_SCHEMA_VERSION:
            raise ValueError(
                "JSON schema version entered does not match!got: '{}', must be: '{}'".format(
                    v, SERVER_SCHEMA_VERSION
                )
            )
        return v

    # @field_serializer("bind_address", when_used="json")
    # def serialize_bind_address(self, bind_address: IPv4Address) -> Optional[str]:
    #     return str(bind_address) if bind_address else None

    # @field_serializer("status", when_used="json")
    # def serialize_status(self, status: ServerStatusEnum) -> str:
    #     return status.value


class ServerConfigCreate(ServerConfigBase):
    status: Annotated[
        ServerStatusEnum, Field(default=ServerStatusEnum.CREATED, exclude=True)
    ]


class ServerConfigUpdate(ServerConfigBase):
    # fmt: off
    container_id: Annotated[
        Optional[str], Field(default=None)
    ]

    name: Annotated[  # pyright: ignore[reportIncompatibleVariableOverride]
        Optional[str],
        Field(default=None, min_length=4, max_length=20)
    ]

    bind_port: Annotated[  # pyright: ignore[reportIncompatibleVariableOverride]
        Optional[int], Field(default=None, gt=0, lt=63535)
    ]

    bind_address: Annotated[
        Optional[IPvAnyAddress], Field(default=None)
    ]

    a2s_port: Annotated[
        Optional[int], Field(default=None, gt=0, lt=63535)
    ]

    rcon_port: Annotated[
        Optional[int], Field(default=None, gt=0, lt=63535)
    ]

    status: Annotated[  # pyright: ignore[reportIncompatibleVariableOverride]
        Optional[ServerStatusEnum],
        Field(default=None, exclude=True)
    ]
    # fmt: on


class ServerConfig(ServerConfigBase):
    id: Annotated[UUID4, Field(default_factory=uuid.uuid4)]
    container_id: Annotated[str, Field()]

    def update_status(self, container: Container):
        if container.id != self.container_id:
            return

        container.reload()
        self.status = ServerStatusEnum[container.status.upper()]

    # @field_serializer("id", when_used="json")
    # def serialize_id(self, id: UUID4) -> str:
    #     return str(id)
