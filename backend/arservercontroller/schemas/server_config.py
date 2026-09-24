import uuid
from ipaddress import IPv4Address
from typing import Annotated

from pydantic import (
    UUID4,
    BaseModel,
    ConfigDict,
    Field,
    IPvAnyAddress,
    field_serializer,
    field_validator,
)
from pydantic.alias_generators import to_camel

from arservercontroller.constants import SERVER_SCHEMA_VERSION, ServerStatusEnum

_PORT_MAX: int = 65535
_PORT_MIN: int = 0


class ServerConfigBase(BaseModel):
    model_config = ConfigDict(
        use_enum_values=True,
        str_max_length=255,
        populate_by_name=True,
        alias_generator=to_camel,
    )

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
        IPvAnyAddress | None,
        Field(IPv4Address("0.0.0.0"))
    ]

    a2s_port: Annotated[
        int | None,
        Field(
            17777,
            gt=_PORT_MIN,
            lt=_PORT_MAX,
            validation_alias="a2sPort",
            serialization_alias="a2sPort",
            alias_priority=2  # don't let alias generator overwrite with `a2SPort`
        )
    ]

    rcon_port: Annotated[
        int | None,
        Field(19999, gt=_PORT_MIN, lt=_PORT_MAX)
    ]

    status: Annotated[
        ServerStatusEnum,
        Field(ServerStatusEnum.DEAD, validate_default=True)
    ]

    command_line: Annotated[
        list[str] | None,
        Field(None)
    ]

    environment: Annotated[
        dict[str, str] | list[str] | None,
        Field(None)
    ]

    extra_ports: Annotated[
        list[tuple[str, int]] | None,
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
        str | None,
        Field(None)
    ] = None

    name: Annotated[
        str | None,
        Field(None, min_length=4, max_length=20)
    ] = None

    bind_port: Annotated[
        int | None,
        Field(None, gt=_PORT_MIN, lt=_PORT_MAX)
    ] = None

    bind_address: Annotated[
        IPvAnyAddress | None,
        Field(None)
    ] = None

    a2s_port: Annotated[
        int | None,
        Field(
            17777,
            gt=_PORT_MIN,
            lt=_PORT_MAX,
            validation_alias="a2sPort",
            serialization_alias="a2sPort",
            alias_priority=2  # don't let alias generator overwrite with `a2SPort`
        )
    ] = None

    rcon_port: Annotated[
        int | None,
        Field(None, gt=_PORT_MIN, lt=_PORT_MAX)
    ] = None

    status: Annotated[
        ServerStatusEnum | None,
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
                f"JSON schema version entered does not match! got: '{v}', must be: '{SERVER_SCHEMA_VERSION}'"
            )
        return v

    @field_serializer("bind_address")
    def serialize_bind_address_maybe(self, v: IPvAnyAddress) -> str | None:
        return str(v) if v else None

    @field_serializer("id")
    def id_to_string(self, v: UUID4) -> str:
        return str(v)

    @field_serializer("container_id", when_used="json")
    def container_id_short(self, container_id: str) -> str:
        return str(container_id[:12])
