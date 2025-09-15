from typing import Annotated
from warnings import deprecated

from arservercontroller.db.base import Any
from arservercontroller.db.models.server import Server
from arservercontroller.db.models.user import User
from arservercontroller.db.repositories.server_repo import ServerRepository
from arservercontroller.db.repositories.user_repo import UserRepository
from arservercontroller.db.session import get_db
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="token")

DbSessionDep = Annotated[Session, Depends(get_db)]
OAuth2TokenDep = Annotated[str, Depends(reusable_oauth2)]
CurrentUserDep = Annotated[User, Any]


@deprecated("")
def get_user_repo(db: DbSessionDep) -> UserRepository:
    return UserRepository(db=db, model=User)


# UserRepositoryDep = Annotated[UserRepository, Depends(get_user_repo)]


@deprecated("")
def get_server_repo(db: DbSessionDep) -> ServerRepository:
    return ServerRepository(db=db, model=Server)


# ServerRepositoryDep = Annotated[ServerRepository, Depends(get_server_repo)]


# def get_config_manager(db: DbSessionDep) -> ServerConfigManagerV2:
#     return ServerConfigManagerV2(db)


# ServerConfigManagerDep = Annotated[ServerConfigManagerV2, Depends(get_config_manager)]


# def get_server_controller(db: DbSessionDep) -> ServerController:
#     return ServerController()
