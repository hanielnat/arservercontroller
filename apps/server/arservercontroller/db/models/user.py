from sqlalchemy import Connection, Integer, String, event
from sqlalchemy.orm import Mapped, Mapper, mapped_column

from arservercontroller.core.security import get_password_hash
from arservercontroller.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        unique=True,
        index=True,
        autoincrement=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String, unique=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="user")


@event.listens_for(User, "before_insert")
@event.listens_for(User, "before_update")
def _hash_password_event(mapper: Mapper, connection: Connection, target: User) -> None:
    if target.hashed_password and not target.hashed_password.startswith("$"):
        target.hashed_password = get_password_hash(target.hashed_password)
