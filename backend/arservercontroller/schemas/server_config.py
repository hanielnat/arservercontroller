import uuid
from ipaddress import IPv4Address
from typing import Annotated, Optional

from pydantic import (
    UUID4,
    BaseModel,
    ConfigDict,
    Field,
    IPvAnyAddress,
    field_serializer,
    field_validator,
)

from arservercontroller.constants import SERVER_SCHEMA_VERSION, ServerStatusEnum

_PORT_MAX: int = 65535
_PORT_MIN: int = 0


class ServerConfigBase(BaseModel):
    model_config = ConfigDict(use_enum_values=True, str_max_length=255)

    # fmt: off
    version: Annotated[
        str,
        Field(SERVER_SCHEMA_VERSION, frozen=True)
    ]

    name: Annotated[
        str,
        Field(min_length=4, max_length=20)
    ]

    bind_port: Annotated[
        int,
        Field(2001, gt=_PORT_MIN, lt=_PORT_MAX)
    ]

    bind_address: Annotated[
        Optional[IPvAnyAddress],
        Field(IPv4Address("0.0.0.0"))
    ]

    a2s_port: Annotated[
        Optional[int],
        Field(17777, gt=_PORT_MIN, lt=_PORT_MAX)
    ]

    rcon_port: Annotated[
        Optional[int],
        Field(19999, gt=_PORT_MIN, lt=_PORT_MAX)
    ]

    status: Annotated[
        ServerStatusEnum,
        Field(ServerStatusEnum.DEAD, validate_default=True)
    ]

    command_line: Annotated[
        Optional[list[str] | str],
        Field(None)
    ]

    arserver_profile_path: Annotated[
        Optional[str],
        Field(None)
    ]

    arserver_config_path: Annotated[
        Optional[str],
        Field(None)
    ]
    # fmt: on


class ServerConfigCreate(ServerConfigBase):
    status: Annotated[
        ServerStatusEnum,
        Field(ServerStatusEnum.CREATED, exclude=True, validate_default=True),
    ]


class ServerConfigUpdate(ServerConfigBase):
    # fmt: off
    container_id: Annotated[
        Optional[str],
        Field(None)
    ] = None

    name: Annotated[  # pyright: ignore[reportIncompatibleVariableOverride]
        Optional[str],
        Field(None, min_length=4, max_length=20)
    ] = None

    bind_port: Annotated[  # pyright: ignore[reportIncompatibleVariableOverride]
        Optional[int],
        Field(None, gt=_PORT_MIN, lt=_PORT_MAX)
    ] = None

    bind_address: Annotated[
        Optional[IPvAnyAddress],
        Field(None)
    ] = None

    a2s_port: Annotated[
        Optional[int],
        Field(None, gt=_PORT_MIN, lt=_PORT_MAX)
    ] = None

    rcon_port: Annotated[
        Optional[int],
        Field(None, gt=_PORT_MIN, lt=_PORT_MAX)
    ] = None

    status: Annotated[  # pyright: ignore[reportIncompatibleVariableOverride]
        Optional[ServerStatusEnum],
        Field(None, exclude=True, validate_default=True)
    ] = None
    # fmt: on


class ServerConfig(ServerConfigBase):
    id: Annotated[UUID4, Field(default_factory=uuid.uuid4)]
    container_id: Annotated[str, Field(default="")]

    @classmethod
    @field_validator("version")
    def schema_version(cls, v: str) -> str:
        if v != SERVER_SCHEMA_VERSION:
            raise ValueError(
                "JSON schema version entered does not match! got: '{}', must be: '{}'".format(
                    v, SERVER_SCHEMA_VERSION
                )
            )
        return v

    @field_serializer("bind_address")
    def serialize_bind_address_maybe(self, v: IPvAnyAddress) -> Optional[str]:
        return str(v) if v else None

    @field_serializer("id")
    def id_to_string(self, v: UUID4) -> str:
        return str(v)
