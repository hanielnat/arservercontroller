from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BaseUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Annotated[str, Field("", min_length=4)]
    email: EmailStr
    role: Annotated[str, Field(default="user", exclude=True)]


class UserUpdate(BaseUser):
    name: Annotated[Optional[str], Field(None, min_length=4)]  # pyright: ignore[reportIncompatibleVariableOverride]
    email: Annotated[Optional[str], Field(None)]  # pyright: ignore[reportIncompatibleVariableOverride]
    password: Annotated[Optional[str], Field(None, min_length=8)]
    role: Annotated[Optional[str], Field(None)]  # pyright: ignore[reportIncompatibleVariableOverride]


class UserRegister(BaseUser):
    password: Annotated[str, Field(min_length=8)]
    role: Annotated[str, Field(exclude=True)]


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseUser):
    id: int


class UserRoleOut(BaseModel):
    id: int
    role: Annotated[str, Field("user")]


class UserRolesOut(BaseModel):
    data: list[str]
    count: int


class UsersOut(BaseModel):
    data: list[UserOut]
    count: int
