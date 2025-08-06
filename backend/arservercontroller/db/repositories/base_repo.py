from abc import ABC, abstractmethod
from ast import TypeVar

from sqlalchemy.ext.asyncio import AsyncSession

from arservercontroller.db.base import Base

TModel = TypeVar("TModel", bound=Base)


class BaseAsyncRepository[TModel](ABC):
    auto_commit: bool = True

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @abstractmethod
    async def find_all(self, model: TModel) -> None:
        raise NotImplementedError()

    @abstractmethod
    async def find_one(self, model: TModel) -> None:
        raise NotImplementedError()

    @abstractmethod
    async def add(self, model: TModel) -> None:
        raise NotImplementedError()

    @abstractmethod
    async def update(self, model: TModel) -> None:
        raise NotImplementedError()

    @abstractmethod
    async def remove(self, model: TModel) -> None:
        raise NotImplementedError()
