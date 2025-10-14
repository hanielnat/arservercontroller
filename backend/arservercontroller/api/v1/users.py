from arservercontroller.api.dependencies import (
    AdminUserDep,
    CurrentUserDep,
    OAuth2FormDep,
)
from arservercontroller.schemas.user import (
    Token,
    UserOut,
    UserRegister,
    UserRoleOut,
    UserRolesOut,
    UsersOut,
    UserUpdate,
)
from arservercontroller.services.user import UserServiceDep
from fastapi import APIRouter

users_router = APIRouter(prefix="/users", tags=["user"])


@users_router.get("/")
async def get_users(
    user_service: UserServiceDep, _: AdminUserDep, offset: int = 0, limit: int = 10
) -> UsersOut:
    users_out = [
        UserOut.model_validate(user) for user in user_service.find_all(offset, limit)
    ]
    return UsersOut(data=users_out, count=len(users_out))


@users_router.post("/login/test-token")
async def get_test_token(
    form_data: OAuth2FormDep,
):
    return Token(
        access_token="testtoken.%s%s" % (form_data.username, form_data.password),
        token_type="bearer",
    )


@users_router.post("/login")
async def login_user(
    form_data: OAuth2FormDep,
    user_service: UserServiceDep,
) -> Token:
    return user_service.login_user(form_data)


@users_router.post("/register")
async def register_user(
    new_user: UserRegister,
    user_sevice: UserServiceDep,
) -> UserOut:
    return user_sevice.register_user(new_user)


@users_router.patch("/{id}")
async def patch_user(
    id: int,
    user_to_update: UserUpdate,
    user_service: UserServiceDep,
    _: AdminUserDep,
) -> UserOut:
    return user_service.update_user(id, user_to_update)


@users_router.delete("/{id}")
async def delete_user(
    id: int,
    user_service: UserServiceDep,
    _: AdminUserDep,
) -> None:
    user_service.delete_user(id)


@users_router.get("/me")
async def read_users_me(current_user: CurrentUserDep):
    return current_user


roles_router = APIRouter(prefix="/users/roles", tags=["user-roles"])


@roles_router.get("/")
async def get_roles(user_service: UserServiceDep) -> UserRolesOut:
    return user_service.get_roles()


@roles_router.get("/permissions")
async def get_role_permissions(user_service: UserServiceDep) -> dict[str, int]:
    return user_service.get_role_permissions()


@roles_router.get("/{id}")
async def get_user_role(
    id: int, user_service: UserServiceDep, _: AdminUserDep
) -> UserRoleOut:
    return user_service.get_user_role(id)


@roles_router.post("/{id}")
async def set_user_role(
    id: int, new_role: str, user_service: UserServiceDep, _: AdminUserDep
) -> None:
    user_service.set_user_role(id, new_role)
