from typing import override
from warnings import deprecated

from arservercontroller.db.models.user import User
from arservercontroller.db.repositories.base_repo import RepositoryInterface

# logger = get_logger(__name__)


@deprecated("")
class UserRepository(RepositoryInterface[User, int]):
    @override
    def find_one(self, key: int) -> User:
        return self.db.query(User).filter(self.model.id == key).first()

    @override
    def find_all(self) -> list[User]:
        return self.db.query(User).all()

    def find_by_email(self, email: str) -> User:
        return self.db.query(User).filter(User.email == email).first()
