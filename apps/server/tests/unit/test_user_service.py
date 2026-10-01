import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from arservercontroller.db.base import Base
from arservercontroller.db.models.user import User
from arservercontroller.services.user import UserService
from arservercontroller.schemas.user import UserRegister
from arservercontroller.core.security import verify_password

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

def test_register_user_service(db_session):
    service = UserService(db_session)
    
    # Test successful registration
    new_user = UserRegister(
        name="testuser",
        email="test@example.com",
        password="securepassword"
    )
    
    user_out = service.register_user(new_user)
    
    assert user_out.name == "testuser"
    assert user_out.email == "test@example.com"
    
    # Check if user is in DB
    db_user = db_session.query(User).filter(User.name == "testuser").first()
    assert db_user is not None
    assert db_user.email == "test@example.com"
    assert db_user.role == "user" # Default role
    
    # Check if password is hashed
    assert db_user.hashed_password != "securepassword"
    assert verify_password("securepassword", db_user.hashed_password)

def test_register_duplicate_user(db_session):
    service = UserService(db_session)
    
    new_user = UserRegister(
        name="testuser",
        email="test@example.com",
        password="securepassword"
    )
    service.register_user(new_user)
    
    # Attempt to register with same name should fail
    with pytest.raises(Exception) as excinfo:
        service.register_user(new_user)
    assert "User name already exists" in str(excinfo.value)
