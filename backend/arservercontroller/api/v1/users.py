from typing import Optional

from arservercontroller.api.dependencies import DbSessionDep
from arservercontroller.db.models.user import User
from arservercontroller.schemas.user import UserOut, UserRegister, UsersOut, UserUpdate
from fastapi import APIRouter, HTTPException
from pydantic import EmailStr, TypeAdapter
from sqlalchemy.exc import NoResultFound

users_router = APIRouter(prefix="/users", tags=["user"])


def find_user_by_email(email: EmailStr, db: DbSessionDep) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def update_user(user_id: int, user_to_update: UserUpdate, db: DbSessionDep) -> UserOut:
    out: User

    try:
        out = db.get_one(User, user_id)
    except NoResultFound as e:
        raise HTTPException(404, f"User not found. Detailed exception: {e}")

    update_data = user_to_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(out, field):
            setattr(out, field, value)

    db.commit()
    db.refresh(out)

    return UserOut.model_validate(out)


@users_router.get("/")
async def get_users(db: DbSessionDep, offset: int = 0, limit: int = 10) -> UsersOut:
    users = TypeAdapter(list[UserOut]).validate_python(
        db.query(User).offset(offset).limit(limit).all()
    )

    return UsersOut(data=users, count=len(users))


@users_router.get("/{email}")
async def get_by_email(
    email: EmailStr,
    db: DbSessionDep,
) -> UserOut:
    user: Optional[User] = find_user_by_email(email, db)
    if not user:
        raise HTTPException(404)

    return UserOut.model_validate(user)


@users_router.post("/")
async def register_user(
    new_user: UserRegister,
    db: DbSessionDep,
) -> UserOut:
    user = User(
        email=new_user.email,
        hashed_password=new_user.password,
        role=new_user.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserOut.model_validate(user, from_attributes=True)


@users_router.patch("/{id}")
async def patch_user(
    id: int,
    user_to_update: UserUpdate,
    db: DbSessionDep,
) -> UserOut:
    out = update_user(id, user_to_update, db)

    return UserOut.model_validate(out)


@users_router.delete("/{email}")
async def delete_user(
    email: EmailStr,
    db: DbSessionDep,
) -> None:
    model = find_user_by_email(email, db)
    if not model:
        raise HTTPException(404, detail=f"User not found. 'email': {email}")

    db.delete(model)
    db.commit()
