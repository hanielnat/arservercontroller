import uuid
from typing import Any, Optional

from sqlalchemy import JSON, UUID, String
from sqlalchemy.orm import Mapped, mapped_column

from arservercontroller.constants import SERVER_SCHEMA_VERSION
from arservercontroller.db.base import Base
from arservercontroller.schemas.server_config import ServerConfig


class Server(Base):
    __tablename__ = "servers"

    id: Mapped[int] = mapped_column(
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

    data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)

    @property
    def server_config_data(self) -> Optional[ServerConfig]:
        return None if not self.data else ServerConfig.model_validate(self.data)

    @server_config_data.setter
    def server_config_data(self, value: Optional[ServerConfig | dict[str, Any]]):
        if value is None:
            self.data = None
        else:
            # Se value for um dicionário, validar como ServerConfig primeiro
            if isinstance(value, dict):
                value = ServerConfig.model_validate(value)

            data_dict = value.model_dump()

            if data_dict.get("id") is not None:
                data_dict["id"] = str(data_dict["id"])

            if data_dict.get("bind_address") is not None:
                data_dict["bind_address"] = str(data_dict["bind_address"])

            if data_dict.get("status") is not None:
                data_dict["status"] = data_dict["status"].value

            self.data = data_dict
