from arservercontroller.schemas.user import UserRegister, UserOut, UserUpdate
import pytest
from pydantic import ValidationError

def test_user_register_schema():
    # Should succeed with required fields
    data = {
        "name": "testuser",
        "email": "test@example.com",
        "password": "securepassword"
    }
    user = UserRegister(**data)
    assert user.name == "testuser"
    assert user.email == "test@example.com"
    assert user.password == "securepassword"
    
    # Should NOT have role field
    assert not hasattr(user, "role")
    
    # Should fail if role is provided (since we didn't add model_config = ConfigDict(extra='forbid'))
    # but let's check if it's in the model dump
    data_with_role = data.copy()
    data_with_role["role"] = "admin"
    user_with_extra = UserRegister(**data_with_role)
    dump = user_with_extra.model_dump()
    assert "role" not in dump

def test_user_out_schema():
    data = {
        "id": 1,
        "name": "testuser",
        "email": "test@example.com",
        "role": "admin"
    }
    user_out = UserOut(**data)
    assert user_out.id == 1
    assert user_out.role == "admin"
    
    dump = user_out.model_dump()
    assert dump["role"] == "admin"

def test_user_update_schema():
    # Test partial update
    data = {"name": "newname"}
    update = UserUpdate(**data)
    assert update.name == "newname"
    assert update.email is None
    assert update.role is None
    
    dump = update.model_dump(exclude_unset=True)
    assert dump == {"name": "newname"}
