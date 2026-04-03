from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BaseUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Annotated[str, Field("", min_length=4, max_length=50)]
    email: Annotated[EmailStr, Field(max_length=255)]


class UserUpdate(BaseUser):
    # fmt: off
    name: Annotated[
        Optional[str],
        Field(None, min_length=4, max_length=50)
    ]

    email: Annotated[
        Optional[EmailStr],
        Field(None, max_length=255)
    ]

    password: Annotated[
        Optional[str],
        Field(None, min_length=8, max_length=255)
    ]

    role: Annotated[
        Optional[str],
        Field(None)
    ]
    # fmt: on


class UserRegister(BaseUser):
    password: Annotated[str, Field(min_length=8, max_length=255)]


class UserLogin(BaseModel):
    name: Annotated[str, Field("", min_length=4, max_length=255)]
    password: Annotated[str, Field("", min_length=8, max_length=255)]


class UserOut(BaseUser):
    id: int
    role: str


class UserRoleOut(BaseModel):
    id: int
    role: Annotated[str, Field("user")]


class UserRolesOut(BaseModel):
    data: list[str]
    count: int


class UsersOut(BaseModel):
    data: list[UserOut]
    count: int


class Token(BaseModel):
    access_token: str
    token_type: Annotated[str, Field("bearer")]


class TokenData(BaseModel):
    username: Annotated[Optional[str], Field(None)]
