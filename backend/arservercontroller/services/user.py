from arservercontroller.db.models.user import User
from arservercontroller.db.repositories.user_repo import UserRepository
from arservercontroller.schemas.user import UserOut, UserRegister


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def register_user(self, user_model: UserRegister) -> UserOut:
        if self.user_repo.find_by_email(user_model.email):
            raise ValueError("Email already exists.")
        new_user = User(email=user_model.email)
        return self.user_repo.add(new_user)
