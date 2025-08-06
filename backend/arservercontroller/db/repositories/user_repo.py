from typing import override

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.exc import UnmappedInstanceError

from arservercontroller.db.models.user import User
from arservercontroller.db.repositories.base_repo import BaseAsyncRepository
from arservercontroller.services.logger import get_logger

logger = get_logger(__name__)


class UserRepository(BaseAsyncRepository[User]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    @override
    async def add(self, model: User) -> None:
        try:
            self.db.add(model)

            if self.auto_commit:
                await self.db.commit()
        except UnmappedInstanceError as e:
            logger.exception(
                "error while adding database model: '%s', exception: %s", model, e
            )
        except Exception as e:
            logger.exception(
                "unexpected error while adding database model: '%s', exception: %s",
                model,
                e,
            )

    @override
    async def update(self, model: User) -> None:
        try:
            await self.db.merge(model)

            if self.auto_commit:
                await self.db.commit()
        except UnmappedInstanceError as e:
            logger.exception(
                "error while updating database model: '%s', exception: %s", model, e
            )
        except Exception as e:
            logger.exception(
                "unexpected error while updating database model: '%s', exception: %s",
                model,
                e,
            )
