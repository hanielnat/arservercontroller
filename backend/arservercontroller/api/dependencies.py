from typing import Annotated

from arservercontroller.core.config import get_config
from arservercontroller.db.session import get_db
from arservercontroller.schemas.user import UserOut
from docker import DockerClient
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

DbSessionDep = Annotated[Session, Depends(get_db)]

oauth2_bearer = OAuth2PasswordBearer(tokenUrl=f"{get_config().API_V1_STR}/users/login")
OAuth2TokenDep = Annotated[str, Depends(oauth2_bearer)]
OAuth2FormDep = Annotated[OAuth2PasswordRequestForm, Depends()]


import docker  # noqa: E402


def get_docker_client() -> DockerClient:
    return docker.from_env()


DockerClientDep = Annotated[DockerClient, Depends(get_docker_client)]

from arservercontroller.services.user import UserServiceDep  # noqa: E402


def _get_current_user(token: OAuth2TokenDep, user_service: UserServiceDep) -> UserOut:
    return user_service.get_current_user(token)


CurrentUserDepV2 = Annotated[UserOut, Depends(_get_current_user)]


async def require_role_checker(
    user: CurrentUserDepV2, required_role: str
) -> CurrentUserDepV2:
    if user.role != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
        )
    return user


async def require_admin_checker(user: CurrentUserDepV2) -> CurrentUserDepV2:
    return await require_role_checker(user, "admin")


async def require_moderator_or_admin_checker(
    user: CurrentUserDepV2,
) -> CurrentUserDepV2:
    if user.role not in ["admin", "moderator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
        )
    return user


CurrentUserDep = CurrentUserDepV2
AdminUserDep = Annotated[CurrentUserDepV2, Depends(require_admin_checker)]
ModeratorOrAdminDep = Annotated[
    CurrentUserDepV2, Depends(require_moderator_or_admin_checker)
]
