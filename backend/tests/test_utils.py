import random
import string
from typing import Dict, Optional, Set, Tuple


class TestUtils:
    """Utility functions for test operations."""

    _used_names: Set[str] = set()
    _used_config_file_names: Set[str] = set()
    _used_ports: Set[Tuple[str, int]] = set()
    _port_range: tuple[int, int] = (20000, 30000)

    @classmethod
    def generate_unique_server_name(cls, prefix: str = "test_server") -> str:
        """Generate a unique server name to avoid conflicts.

        Args:
            prefix: Prefix for the server name.

        Returns:
            str: A unique server name string.

        Raises:
            RuntimeError: when failed to generate a unique server name after max attempts
        """
        max_attempts = 10

        for _ in range(max_attempts):
            # Generate a random suffix with 8 characters
            suffix = "".join(
                random.choices(string.ascii_lowercase + string.digits, k=8)
            )
            name = f"{prefix}_{suffix}"

            if name not in cls._used_names:
                cls._used_names.add(name)
                return name

        raise RuntimeError(
            f"Failed to generate unique server name after {max_attempts} attempts"
        )

    @classmethod
    def clear_used_names(cls) -> None:
        """Clear the set of used names for testing purposes."""
        cls._used_names.clear()

    @classmethod
    def generate_unique_config_file_name(
        cls, prefix: str = "testServerConfig", file_extension: Optional[str] = "json"
    ) -> str:
        """Generate a unique name for the config file of the ARServer to avoid testing conflicts.

        Generates a unique config file name by combining the prefix with a random suffix.
        The name is guaranteed to be unique across all calls to this method.

        Args:
            prefix (str, optional): Prefix for the config file name. Defaults to "testServerConfig".
            file_extension (Optional[str], optional): File extension to use for the config file. Defaults to "json".

        Returns:
            str: A unique config file name string.
        """
        max_attempts = 10

        for _ in range(max_attempts):
            # Generate a random suffix with 8 characters
            suffix = "".join(
                random.choices(string.ascii_lowercase + string.digits, k=8)
            )

            file_name = (
                f"{prefix}_{suffix}.{file_extension}"
                if file_extension
                else f"{prefix}_{suffix}"
            )

            if file_name not in cls._used_config_file_names:
                cls._used_config_file_names.add(file_name)
                return file_name

        raise RuntimeError(
            f"Failed to generate unique config file name after {max_attempts} attempts"
        )

    @classmethod
    def clear_used_config_file_names(cls) -> None:
        """Clear the set of used config file names for testing purposes."""
        cls._used_config_file_names.clear()

    @classmethod
    def generate_unique_server_port(cls, port_type: str = "tcp") -> Dict[str, int]:
        """Generate a unique random port number to avoid conflicts in tests.

        Args:
            port_type (str): one of `tcp` or `udp`.

        Returns:
            (Dict[str,int]): A unique port number with it's passed port type.

        Raises:
            RuntimeError: when failed to generate a unique port number after `max_attempts`
        """
        max_attempts = 10
        min_port, max_port = cls._port_range

        for _ in range(max_attempts):
            value: int = random.randint(min_port, max_port)
            port_entry = (port_type, value)

            if port_entry not in cls._used_ports:
                cls._used_ports.add(port_entry)
                return {port_type: value}

        raise RuntimeError(
            f"Failed to generate unique '{port_type}' port after {max_attempts} attempts"
        )

    @classmethod
    def clear_used_server_ports(cls) -> None:
        """Clear the set of used ports for testing purposes."""
        cls._used_ports.clear()
