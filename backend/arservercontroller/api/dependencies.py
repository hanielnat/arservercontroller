from typing import Annotated

from arservercontroller.core.config import get_config
from arservercontroller.db.session import get_db
from docker import DockerClient
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

DbSessionDep = Annotated[Session, Depends(get_db)]

oauth2_bearer = OAuth2PasswordBearer(tokenUrl=f"{get_config().API_V1_STR}/users/login")
OAuth2TokenDep = Annotated[str, Depends(oauth2_bearer)]
OAuth2FormDep = Annotated[OAuth2PasswordRequestForm, Depends()]


def get_docker_client(**docker_kwargs) -> DockerClient:
    import docker

    return docker.from_env(**docker_kwargs)


DockerClientDep = Annotated[DockerClient, Depends(get_docker_client)]
