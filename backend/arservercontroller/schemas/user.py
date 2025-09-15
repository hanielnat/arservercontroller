from pydantic import BaseModel, ConfigDict, EmailStr


class BaseUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: EmailStr
    role: str


class UserUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: EmailStr
    password: str
    role: str


class UserRegister(BaseUser):
    password: str


class UserOut(BaseUser):
    id: int


class UsersOut(BaseModel):
    data: list[UserOut]
    count: int
