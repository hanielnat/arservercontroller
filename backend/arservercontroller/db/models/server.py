import datetime
import uuid
from typing import Any

from sqlalchemy import JSON, UUID, Connection, String, event
from sqlalchemy.orm import Mapped, Mapper, mapped_column

from arservercontroller.constants import SERVER_SCHEMA_VERSION
from arservercontroller.db.base import Base
from arservercontroller.schemas.server_config import ServerConfig


class Server(Base):
    __tablename__ = "servers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    version: Mapped[str] = mapped_column(
        String, nullable=False, default=SERVER_SCHEMA_VERSION
    )
    created_at: Mapped[int]
    updated_at: Mapped[int]

    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=True)

    @property
    def server_config_data(self) -> ServerConfig:
        return ServerConfig.model_validate(self.data)

    @server_config_data.setter
    def server_config_data(self, value: ServerConfig | dict[str, Any]) -> None:
        if isinstance(value, dict):
            value = ServerConfig.model_validate(value)

        self.data = value.model_dump()


@event.listens_for(Server, "before_insert")
def _set_created_timestamp_event(mapper, connection, target: Server) -> None:
    now = int(datetime.datetime.now().timestamp())
    target.created_at = now
    target.updated_at = now


@event.listens_for(Server, "before_update")
def _set_updated_timestamp_event(mapper, connection, target: Server) -> None:
    target.updated_at = int(datetime.datetime.now().timestamp())
