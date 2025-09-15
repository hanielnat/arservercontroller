from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from warnings import deprecated

from sqlalchemy.orm import Session


M = TypeVar("M")
K = TypeVar("K")


@deprecated("")
class RepositoryInterface(ABC, Generic[M, K]):
    def __init__(
        self,
        db: Session,
        # db: DbSessionDep,
        model: type[M],
    ) -> None:
        self.db = db
        self.model = model

    @abstractmethod
    def find_one(self, key: K) -> M:
        raise NotImplementedError()

    @abstractmethod
    def find_all(self) -> list[M]:
        raise NotImplementedError()

    def add(self, model: M) -> M:
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return model

    def update(self, model: M) -> M:
        self.db.commit()
        self.db.refresh(model)
        return model

    def remove(self, key: K) -> bool:
        obj = self.find_one(key)

        if not obj:
            return False

        self.db.delete(obj)
        self.db.commit()
        return True
