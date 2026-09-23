from typing import Annotated

from docker import DockerClient
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from arservercontroller.core.config import get_config
from arservercontroller.db.session import get_db
from arservercontroller.schemas.user import UserOut

type DbSessionDep = Annotated[Session, Depends(get_db)]

oauth2_bearer = OAuth2PasswordBearer(tokenUrl=f"{get_config().API_V1_STR}/users/login")
type OAuth2TokenDep = Annotated[str, Depends(oauth2_bearer)]
type OAuth2FormDep = Annotated[OAuth2PasswordRequestForm, Depends()]


import docker

_docker_client: DockerClient | None = None


def get_docker_client() -> DockerClient:
    global _docker_client
    if _docker_client is None:
        _docker_client = docker.from_env()

    return _docker_client


type DockerClientDep = Annotated[DockerClient, Depends(get_docker_client)]


def _get_current_user(token: OAuth2TokenDep, db: DbSessionDep) -> UserOut:
    from arservercontroller.services.user import UserService

    user_service = UserService(db)
    return user_service.get_current_user(token)


type CurrentUserDep = Annotated[UserOut, Depends(_get_current_user)]
