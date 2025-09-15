import json
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

    # TODO: verificar se é possível usar Mapped[ServerConfig]
    data: Mapped[Any] = mapped_column(JSON, nullable=True)

    @property
    def server_config_data(self) -> Optional[ServerConfig]:
        if self.data is None:
            return None

        if isinstance(self.data, str):
            data_dict = json.loads(self.data)
        else:
            data_dict = self.data

        return ServerConfig.model_validate(data_dict)

    @server_config_data.setter
    def server_config_data(self, value: Optional[ServerConfig]):
        if value is None:
            self.data = None
        else:
            # Se value for um dicionário, validar como ServerConfig primeiro
            if isinstance(value, dict):
                value = ServerConfig.model_validate(value)

            data_dict = value.model_dump()

            for field in ["id", "container_id"]:
                if data_dict.get(field) is not None:
                    data_dict[field] = str(data_dict[field])

            if data_dict.get("bind_address") is not None:
                data_dict["bind_address"] = str(data_dict["bind_address"])

            if data_dict.get("status") is not None:
                data_dict["status"] = data_dict["status"].value

            self.data = data_dict
