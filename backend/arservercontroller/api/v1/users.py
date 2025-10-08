from datetime import timedelta
from typing import Annotated, Optional

import jwt
from arservercontroller.api.dependencies import (
    DbSessionDep,
    OAuth2TokenDep,
)
from arservercontroller.core.config import get_config
from arservercontroller.core.security import (
    ALGORITHM,
    create_access_token,
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
    UsersOut,
    UserUpdate,
)
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from pydantic import EmailStr, ValidationError

_settings = get_config()
users_router = APIRouter(prefix="/users", tags=["user"])


def find_user_by_id(id: int, db: DbSessionDep) -> User:
    model = db.get(User, id)
    if not model:
        raise HTTPException(404, "User not found.")

    return model


def find_user_by_email(email: EmailStr, db: DbSessionDep) -> User:
    model = db.query(User).filter(User.email == email).first()
    if not model:
        raise HTTPException(404, "User not found.")

    return model


def find_user_by_name(name: str, db: DbSessionDep) -> Optional[User]:
    return db.query(User).filter(User.name == name).first()


def auth_user(user: UserLogin, db: DbSessionDep) -> User:
    unauthorized_exception = HTTPException(
        401, "Invalid user credentials", {"WWW-Authenticate": "Bearer"}
    )

    model = find_user_by_name(user.name, db)
    if not model:
        raise unauthorized_exception

    if not verify_password(user.password, model.hashed_password):
        raise unauthorized_exception

    return model


def get_current_user(token: OAuth2TokenDep, db: DbSessionDep) -> UserOut:
    unauthorized_exception = HTTPException(
        status_code=401,
        detail="Invalid user credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, _settings.SECRET_KEY, algorithms=[ALGORITHM])
        token_data = TokenData(**payload)
    except (InvalidTokenError, ValidationError):
        raise unauthorized_exception

    user = find_user_by_name(str(token_data.username), db)
    if user is None:
        raise unauthorized_exception

    return UserOut.model_validate(user)


CurrentUserDep = Annotated[UserOut, Depends(get_current_user)]


@users_router.get("/")
async def get_users(db: DbSessionDep, offset: int = 0, limit: int = 10) -> UsersOut:
    users = db.query(User).offset(offset).limit(limit).all()
    users_out = [UserOut.model_validate(user) for user in users]

    return UsersOut(data=users_out, count=len(users_out))


@users_router.post("/login/test-token")
async def get_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    return Token(
        access_token="testtoken.%s%s" % (form_data.username, form_data.password),
        token_type="bearer",
    )


@users_router.post("/login")
async def login_user(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DbSessionDep,
) -> Token:
    user_form_data = UserLogin(name=form_data.username, password=form_data.password)
    model = auth_user(user_form_data, db)
    token_expires_delta = timedelta(minutes=get_config().JWT_EXPIRE_MINUTES)

    token = create_access_token(
        {"username": model.name},
        token_expires_delta,
    )

    return Token(access_token=token, token_type="bearer")


@users_router.post("/register")
async def register_user(
    new_user: UserRegister,
    db: DbSessionDep,
) -> UserOut:
    try:
        if find_user_by_email(new_user.email, db):
            raise HTTPException(500, "E-mail already taken")
    except HTTPException:
        pass

    user_model = User(
        name=new_user.name, email=new_user.email, hashed_password=new_user.password
    )

    db.add(user_model)
    db.commit()
    db.refresh(user_model)

    return UserOut.model_validate(user_model)


@users_router.put("/{id}")
async def patch_user(
    id: int,
    user_to_update: UserUpdate,
    db: DbSessionDep,
) -> UserOut:
    model = find_user_by_id(id, db)

    update_data = user_to_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(model, field):
            setattr(model, field, value)

    db.commit()
    db.refresh(model)

    return UserOut.model_validate(model)


@users_router.delete("/{email}")
async def delete_user(
    email: EmailStr,
    db: DbSessionDep,
) -> None:
    model = find_user_by_email(email, db)
    if not model:
        raise HTTPException(404, detail="User not found")

    db.delete(model)
    db.commit()


@users_router.get("/me")
async def read_users_me(current_user: CurrentUserDep):
    return current_user


roles_router = APIRouter(prefix="/users/roles", tags=["user-roles"])


@roles_router.get("/")
async def get_roles() -> UserRolesOut:
    roles = ["admin", "moderator", "user"]
    return UserRolesOut(data=roles, count=len(roles))


@roles_router.get("/{id}")
async def get_user_role(id: int, db: DbSessionDep) -> UserRoleOut:
    model = find_user_by_id(id, db)
    return UserRoleOut(id=model.id, role=model.role)


@roles_router.post("/{id}")
async def set_user_role(id: int, new_role: str, db: DbSessionDep) -> None:
    model = find_user_by_id(id, db)
    model.role = new_role

    db.commit()
    db.refresh(model)
