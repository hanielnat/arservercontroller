from abc import ABC, abstractmethod
from typing import Any, Callable, Generic, TypeVar

__all__ = ("ResultAccessError", "Result", "Ok", "Err")

_T = TypeVar("_T")
_E = TypeVar("_E")
_U = TypeVar("_U")


class ResultAccessError(Exception):
    """Raised when attempting to access an invalid Result state."""

    pass


class Result(ABC, Generic[_T, _E]):
    """A type representing either a success value (Ok) or an error (Err)."""

    @abstractmethod
    def is_ok(self) -> bool:
        """Return True if the Result is Ok."""
        ...

    @abstractmethod
    def is_err(self) -> bool:
        """Return True if the Result is Err."""
        ...

    @abstractmethod
    def value(self) -> _T:
        """Return the value if Ok, else raise ResultAccessError."""
        ...

    @abstractmethod
    def error(self) -> _E:
        """Return the error if Err, else raise ResultAccessError."""
        ...

    @abstractmethod
    def value_or(self, default: _T) -> _T:
        """Return the value if Ok, else return the default."""
        ...

    @abstractmethod
    def map(self, func: Callable[[_T], _U]) -> "Result[_U, _E]":
        """Apply a function to the value if Ok, else return Err."""
        ...

    @abstractmethod
    def then(self, func: Callable[[_T], "Result[_U, _E]"]) -> "Result[_U, _E]":
        """Apply a function returning a Result to the value if Ok, else return Err."""
        ...

    @abstractmethod
    def or_else(self, func: Callable[[_E], "Result[_T, _U]"]) -> "Result[_T, _U]":
        """Apply a function returning a Result to the error if Err, else return Ok."""
        ...

    @abstractmethod
    def __eq__(self, other: Any) -> bool:
        """Check if two Results are equal."""
        ...

    @abstractmethod
    def __str__(self) -> str:
        """Return a user-friendly string representation."""
        ...

    @abstractmethod
    def __bool__(self) -> bool:
        """Return True if Ok, False if Err."""
        ...

    @abstractmethod
    def __or__(self, func: Callable[[_E], "Result[_T, _U]"]) -> "Result[_T, _U]":
        """Apply or_else using the | operator."""
        ...

    @abstractmethod
    def __and__(self, func: Callable[[_T], "Result[_U, _E]"]) -> "Result[_U, _E]":
        """Apply and_then using the & operator."""
        ...

    @classmethod
    def success(cls, value: _T) -> "Result[_T, _E]":
        """Create an Ok Result with the given value."""
        return Ok(value)

    @classmethod
    def fail(cls, error: _E) -> "Result[_T, _E]":
        """Create an Err Result with the given error."""
        return Err(error)


class Ok(Result[_T, _E]):
    """Represents a successful Result with a value."""

    __match_args__: tuple = ("_value",)

    def __init__(self, value: _T) -> None:
        self._value = value

    def is_ok(self) -> bool:
        return True

    def is_err(self) -> bool:
        return False

    def value(self) -> _T:
        return self._value

    def error(self) -> _E:
        raise ResultAccessError("Cannot access error on Ok Result")

    def value_or(self, default: _T) -> _T:
        return self._value

    def map(self, func: Callable[[_T], _U]) -> "Result[_U, _E]":
        return Ok(func(self._value))

    def then(self, func: Callable[[_T], "Result[_U, _E]"]) -> "Result[_U, _E]":
        return func(self._value)

    def or_else(self, func: Callable[[_E], "Result[_T, _U]"]) -> "Result":
        return self  # No-op for Ok

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, Result):
            return False
        return isinstance(other, Ok) and self._value == other._value

    def __str__(self) -> str:
        return f"Success: {self._value!s}"

    def __bool__(self) -> bool:
        return True

    def __or__(self, func: Callable[[_E], "Result[_T, _U]"]) -> "Result":
        return self  # No-op for Ok

    def __and__(self, func: Callable[[_T], "Result[_U, _E]"]) -> "Result[_U, _E]":
        return self.then(func)

    def __repr__(self) -> str:
        return f"Ok({self._value!r})"


class Err(Result[_T, _E]):
    """Represents a failed Result with an error."""

    __match_args__: tuple = ("_error",)

    def __init__(self, error: _E) -> None:
        self._error = error

    def is_ok(self) -> bool:
        return False

    def is_err(self) -> bool:
        return True

    def value(self) -> _T:
        raise ResultAccessError("Cannot access value on Err Result")

    def error(self) -> _E:
        return self._error

    def value_or(self, default: _T) -> _T:
        return default

    def map(self, func: Callable[[_T], _U]) -> "Result":
        return self  # No-op for Err

    def then(self, func: Callable[[_T], "Result[_U, _E]"]) -> "Result":
        return self  # No-op for Err

    def or_else(self, func: Callable[[_E], "Result[_T, _U]"]) -> "Result[_T, _U]":
        return func(self._error)

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, Result):
            return False

        if not isinstance(other, Err):
            return False

        # For exceptions, compare type and string representation
        if isinstance(self._error, BaseException) and isinstance(
            other._error, BaseException
        ):
            return type(self._error) is type(other._error) and str(self._error) == str(
                other._error
            )

        # For non-exceptions, use default equality
        return self._error == other._error

    def __str__(self) -> str:
        return f"Error: {self._error!s}"

    def __bool__(self) -> bool:
        return False

    def __or__(self, func: Callable[[_E], "Result[_T, _U]"]) -> "Result[_T, _U]":
        return self.or_else(func)

    def __and__(self, func: Callable[[_T], "Result[_U, _E]"]) -> "Result":
        return self  # No-op for Err

    def __repr__(self) -> str:
        return f"Err({self._error!r})"


def do_something(data: str) -> Result[str, Exception]:
    if not data:
        return Result.fail(RuntimeError("data must not be empty"))
    return Result.success(data + " test")


if __name__ == "__main__":
    # Success case
    _res1 = do_something("data")
    print(_res1)
    print(repr(_res1))

    if _res1:
        print(f"Value: {_res1.value()}")

    # Error case
    _res2 = do_something("")
    print(_res2)
    print(repr(_res2))

    # Equality
    _res3 = do_something("data")
    print(_res1 == _res3)
    print(_res1 == _res2)

    # Boolean context
    if _res1:
        print("_res1 is Ok")
    if not _res2:
        print("_res2 is Err")

    # Operator chaining
    _res4 = _res1 & (lambda x: Result.success(x.upper()))  # and_then
    print(_res4)

    _res5: Result[str, Any] = _res2 | (lambda e: Result.success("recovered"))  # or_else
    print(_res5)

    # Pattern matching
    match _res1:
        case Ok(_value=value):
            print(f"Got value: {value}")
        case Err(_error=error):
            print(f"Got error: {error}")
