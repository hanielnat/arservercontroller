from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from passlib.context import CryptContext
from pwdlib import PasswordHash

from arservercontroller.core.config import get_config

ALGORITHM = "HS256"

_settings = get_config()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
password_hash = PasswordHash.recommended()


def create_access_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": datetime.now(UTC) + expires_delta})
    encoded_jwt = jwt.encode(to_encode, _settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        result = pwd_context.verify(plain_password, hashed_password)
    except Exception:
        result = password_hash.verify(plain_password, hashed_password)

    return result


def get_password_hash(password: str) -> str:
    try:
        result = pwd_context.hash(password)
    except Exception:
        result = password_hash.hash(password)

    return result
