from typing import override
from warnings import deprecated

from sqlalchemy import UUID

from arservercontroller.db.models.server import Server
from arservercontroller.db.repositories.base_repo import RepositoryInterface

# logger = get_logger(__name__)


@deprecated("")
class ServerRepository(RepositoryInterface[Server, UUID]):
    @override
    def find_one(self, key: UUID) -> Server:
        return self.db.query(Server).filter(self.model.id == key).first()

    @override
    def find_all(self) -> list[Server]:
        return self.db.query(Server).all()
