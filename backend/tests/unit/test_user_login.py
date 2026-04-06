import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from arservercontroller.db.base import Base
from arservercontroller.db.models.user import User
from arservercontroller.services.user import UserService
from arservercontroller.schemas.user import UserRegister
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import HTTPException

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_login_user_service(db_session):
    service = UserService(db_session)
    
    # Pre-register a user
    new_user = UserRegister(
        name="testuser",
        email="test@example.com",
        password="securepassword"
    )
    service.register_user(new_user)
    
    # Test successful login using OAuth2PasswordRequestForm
    form_data = OAuth2PasswordRequestForm(
        username="testuser",
        password="securepassword"
    )
    
    token = service.login_user(form_data)
    assert token.access_token is not None
    assert token.token_type == "bearer"

def test_login_invalid_password(db_session):
    service = UserService(db_session)
    
    new_user = UserRegister(
        name="testuser",
        email="test@example.com",
        password="securepassword"
    )
    service.register_user(new_user)
    
    # Attempt login with wrong password
    form_data = OAuth2PasswordRequestForm(
        username="testuser",
        password="wrongpassword"
    )
    
    with pytest.raises(HTTPException) as excinfo:
        service.login_user(form_data)
    assert excinfo.value.status_code == 401
    assert "Invalid user credentials" in str(excinfo.value.detail)

def test_login_invalid_username(db_session):
    service = UserService(db_session)
    
    # Attempt login with non-existent username
    form_data = OAuth2PasswordRequestForm(
        username="nonexistent",
        password="anypassword"
    )
    
    with pytest.raises(HTTPException) as excinfo:
        service.login_user(form_data)
    assert excinfo.value.status_code == 401
    assert "Invalid user credentials" in str(excinfo.value.detail)
