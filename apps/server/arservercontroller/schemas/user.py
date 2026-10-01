from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel, to_snake
from pydantic.aliases import AliasGenerator


class BaseUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Annotated[str, Field("", min_length=4, max_length=50)]
    email: Annotated[EmailStr, Field(max_length=255)]


class UserUpdate(BaseUser):
    # fmt: off
    name: Annotated[  # pyright: ignore[reportIncompatibleVariableOverride]
        str | None,
        Field(None, min_length=4, max_length=50)
    ]

    email: Annotated[  # pyright: ignore[reportIncompatibleVariableOverride]
        EmailStr | None,
        Field(None, max_length=255)
    ]

    password: Annotated[
        str | None,
        Field(None, min_length=8, max_length=255)
    ]

    role: Annotated[
        str | None,
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
    model_config = ConfigDict(
        alias_generator=AliasGenerator(
            serialization_alias=to_camel, validation_alias=to_snake
        )
    )

    access_token: str
    token_type: Annotated[str, Field("bearer")]


class TokenData(BaseModel):
    username: Annotated[str | None, Field(None)]
