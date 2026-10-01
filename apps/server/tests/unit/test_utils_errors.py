import pytest
from arservercontroller.utils.errors import Err, Ok, Result, ResultAccessError


def test_initialization_ok():
    """Test creating an Ok Result with a success value."""
    result = Result.success("data")
    assert isinstance(result, Ok)
    assert result.value() == "data"
    assert result.is_ok()
    assert not result.is_err()


def test_initialization_err():
    """Test creating an Err Result with an error."""
    error = RuntimeError("error")
    result = Result.fail(error)
    assert isinstance(result, Err)
    assert result.error() is error
    assert not result.is_ok()
    assert result.is_err()


def test_value_access_ok():
    """Test accessing value from an Ok Result."""
    result = Result.success(42)
    assert result.value() == 42


def test_value_access_err():
    """Test accessing value from an Err Result raises ResultAccessError."""
    result = Result.fail(RuntimeError("error"))
    with pytest.raises(ResultAccessError):
        result.value()


def test_error_access_ok():
    """Test accessing error from an Ok Result raises ResultAccessError."""
    result = Result.success("data")
    with pytest.raises(ResultAccessError):
        result.error()


def test_error_access_err():
    """Test accessing error from an Err Result."""
    error = RuntimeError("error")
    result = Result.fail(error)
    assert result.error() is error


def test_value_or_ok():
    """Test value_or returns the value for an Ok Result."""
    result = Result.success("data")
    assert result.value_or("default") == "data"


def test_value_or_err():
    """Test value_or returns the default for an Err Result."""
    result = Result.fail(RuntimeError("error"))
    assert result.value_or("default") == "default"


def test_map_ok():
    """Test map applies a function to the value of an Ok Result."""
    result = Result.success("data")
    mapped = result.map(str.upper)
    assert isinstance(mapped, Ok)
    assert mapped.value() == "DATA"


def test_map_err():
    """Test map does not apply the function for an Err Result."""
    error = RuntimeError("error")
    result = Result.fail(error)
    mapped = result.map(str.upper)
    assert isinstance(mapped, Err)
    assert mapped.error() is error


def test_and_then_ok():
    """Test and_then applies a function returning a Result for an Ok Result."""

    def to_upper_result(s: str) -> Result[str, RuntimeError]:
        return Result.success(s.upper())

    result = Result.success("data")
    chained = result.then(to_upper_result)
    assert isinstance(chained, Ok)
    assert chained.value() == "DATA"


def test_and_then_err():
    """Test and_then does not apply the function for an Err Result."""
    error = RuntimeError("error")
    result = Result.fail(error)
    chained = result.then(lambda x: Result.success(x.upper()))
    assert isinstance(chained, Err)
    assert chained.error() is error


def test_or_else_ok():
    """Test or_else does not apply the function for an Ok Result."""
    result = Result.success("data")
    chained = result.or_else(lambda e: Result.success("recovered"))
    assert isinstance(chained, Ok)
    assert chained.value() == "data"


def test_or_else_err():
    """Test or_else applies a function returning a Result for an Err Result."""
    error = RuntimeError("error")
    result = Result.fail(error)
    chained = result.or_else(lambda e: Result.success("recovered"))
    assert isinstance(chained, Ok)
    assert chained.value() == "recovered"


def test_operator_and_ok():
    """Test & operator applies and_then for an Ok Result."""
    result = Result.success("data")
    chained = result & (lambda x: Result.success(x.upper()))
    assert isinstance(chained, Ok)
    assert chained.value() == "DATA"


def test_operator_and_err():
    """Test & operator does not apply for an Err Result."""
    error = RuntimeError("error")
    result = Result.fail(error)
    chained = result & (lambda x: Result.success(x.upper()))
    assert isinstance(chained, Err)
    assert chained.error() is error


def test_operator_or_ok():
    """Test | operator does not apply for an Ok Result."""
    result = Result.success("data")
    chained = result | (lambda e: Result.success("recovered"))
    assert isinstance(chained, Ok)
    assert chained.value() == "data"


def test_operator_or_err():
    """Test | operator applies or_else for an Err Result."""
    error = RuntimeError("error")
    result = Result.fail(error)
    chained = result | (lambda e: Result.success("recovered"))
    assert isinstance(chained, Ok)
    assert chained.value() == "recovered"


def test_bool_ok():
    """Test Ok Result evaluates to True in boolean context."""
    result = Result.success("data")
    assert bool(result) is True


def test_bool_err():
    """Test Err Result evaluates to False in boolean context."""
    result = Result.fail(RuntimeError("error"))
    assert bool(result) is False


def test_equality_ok():
    """Test equality comparison between Ok Results."""
    result1 = Result.success("data")
    result2 = Result.success("data")
    result3 = Result.success("other")
    assert result1 == result2
    assert result1 != result3


def test_equality_err():
    """Test equality comparison between Err Results."""
    error1 = RuntimeError("error")
    error2 = RuntimeError("error")
    result1 = Result.fail(error1)
    result2 = Result.fail(error2)
    result3 = Result.fail(RuntimeError("other"))
    assert result1 == result2
    assert result1 != result3


def test_equality_mixed():
    """Test equality comparison between Ok and Err Results."""
    result1 = Result.success("data")
    result2 = Result.fail(RuntimeError("error"))
    assert result1 != result2


def test_equality_non_result():
    """Test equality comparison with non-Result types."""
    result = Result.success("data")
    assert result != "data"
    assert result is not None


def test_str_ok():
    """Test string representation of an Ok Result."""
    result = Result.success("data")
    assert str(result) == "Success: data"


def test_str_err():
    """Test string representation of an Err Result."""
    result = Result.fail(RuntimeError("error"))
    assert str(result) == "Error: error"


def test_repr_ok():
    """Test repr representation of an Ok Result."""
    result = Result.success("data")
    assert repr(result) == "Ok('data')"


def test_repr_err():
    """Test repr representation of an Err Result."""
    result = Result.fail(RuntimeError("error"))
    assert repr(result) == "Err(RuntimeError('error'))"


def test_pattern_matching_ok():
    """Test pattern matching with an Ok Result."""
    result = Result.success("data")
    match result:
        case Ok(_value=value):
            assert value == "data"
        case Err(_error=_):
            pytest.fail("Expected Ok, got Err")


def test_pattern_matching_err():
    """Test pattern matching with an Err Result."""
    error = RuntimeError("error")
    result = Result.fail(error)
    match result:
        case Ok(_value=_):
            pytest.fail("Expected Err, got Ok")
        case Err(_error=err):
            assert err is error
