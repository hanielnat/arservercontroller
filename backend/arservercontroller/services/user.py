from datetime import timedelta
from typing import Annotated, Optional

import jwt
from fastapi import Depends, HTTPException, status
from jwt.exceptions import InvalidTokenError
from pydantic import EmailStr, ValidationError

from arservercontroller.api.dependencies import (
    DbSessionDep,
    OAuth2FormDep,
    OAuth2TokenDep,
)
from arservercontroller.constants import RolePermissions, UserRoles
from arservercontroller.core.config import get_config
from arservercontroller.core.security import (
    ALGORITHM,
    create_access_token,
    get_password_hash,
    verify_password,
)
from arservercontroller.db.models.user import User
from arservercontroller.schemas.user import (
    Token,
    TokenData,
    UserLogin,
    UserOut,
    UserRegister,
    UserRoleOut,
    UserRolesOut,
    UserUpdate,
)

_settings = get_config()


class UserService:
    def __init__(self, db: DbSessionDep):
        self._db = db
        self._user_not_found_exception = HTTPException(
            status.HTTP_404_NOT_FOUND, "User not found"
        )
        self._unauthorized_exception = HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid user credentials",
            {"WWW-Authenticate": "Bearer"},
        )

    def find_all(self, offset: int, limit: int) -> list[User]:
        return self._db.query(User).offset(offset).limit(limit).all()

    def find_by_id(self, id: int) -> Optional[User]:
        return self._db.get(User, id)

    def find_by_name(self, name: str) -> Optional[User]:
        return self._db.query(User).filter(User.name == name).first()

    def find_by_email(self, email: EmailStr) -> Optional[User]:
        return self._db.query(User).filter(User.email == email).first()

    def auth_user(self, user: UserLogin) -> User:
        model = self.find_by_name(user.name)
        if not model:
            raise self._unauthorized_exception

        if not verify_password(user.password, model.hashed_password):
            raise self._unauthorized_exception

        return model

    def get_current_user(self, token: OAuth2TokenDep) -> UserOut:
        try:
            payload = jwt.decode(token, _settings.SECRET_KEY, algorithms=[ALGORITHM])
            token_data = TokenData(**payload)
        except (InvalidTokenError, ValidationError):
            raise self._unauthorized_exception

        user = self.find_by_name(str(token_data.username))
        if user is None:
            raise self._unauthorized_exception

        return UserOut.model_validate(user)

    def update_user(self, id: int, user: UserUpdate) -> UserOut:
        model = self.find_by_id(id)
        if not model:
            raise self._user_not_found_exception

        update_data = user.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(model, field):
                setattr(model, field, value)

        self._db.commit()
        self._db.refresh(model)

        return UserOut.model_validate(model)

    def delete_user(self, id: int) -> None:
        model = self.find_by_id(id)
        if not model:
            raise self._user_not_found_exception

        self._db.delete(model)
        self._db.commit()

    def register_user(self, new_user: UserRegister) -> UserOut:
        if self.find_by_name(new_user.name):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "User name already exists")

        user_model = User(
            name=new_user.name,
            email=new_user.email,
            hashed_password=get_password_hash(new_user.password),
        )
        self._db.add(user_model)
        self._db.commit()
        self._db.refresh(user_model)

        return UserOut.model_validate(user_model)

    def login_user(self, form_data: OAuth2FormDep) -> Token:
        user_form = UserLogin(name=form_data.username, password=form_data.password)
        model = self.auth_user(user_form)
        return self.create_access_token({"username": model.name})

    def create_access_token(self, data: dict) -> Token:
        token_expires_delta = timedelta(minutes=_settings.JWT_EXPIRE_MINUTES)
        token = create_access_token(data, token_expires_delta)
        return Token(access_token=token, token_type="bearer")

    @classmethod
    def get_role_permissions(cls) -> dict[str, int]:
        permissions: dict[str, int] = {}
        for member_name, member in RolePermissions.__members__.items():
            permissions.update({member_name: member.value})

        return permissions

    @classmethod
    def get_roles(cls) -> UserRolesOut:
        roles: list[str] = []
        for k in UserRoles:
            roles.append(k)

        return UserRolesOut(data=roles, count=len(roles))

    def get_user_role(self, id: int) -> UserRoleOut:
        model = self.find_by_id(id)
        if not model:
            raise self._user_not_found_exception

        return UserRoleOut(id=model.id, role=model.role)

    def set_user_role(self, id: int, new_role: str) -> None:
        model = self.find_by_id(id)
        if not model:
            raise self._user_not_found_exception

        model.role = new_role
        self._db.commit()
        self._db.refresh(model)


def get_user_service(db: DbSessionDep) -> UserService:
    return UserService(db)


UserServiceDep = Annotated[UserService, Depends(get_user_service)]
