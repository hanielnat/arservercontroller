import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional

from rich.console import Console
from rich.logging import RichHandler
from rich.theme import Theme

from arservercontroller.constants import directory_manager


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get the logger instance for the ARServerController project.
    Args:
        name: (Optional[str], optional): Is the name of the logger module to display.

    Returns:
        logging.Logger: The logger instance to use for logging.
    """
    logger = logging.getLogger(name)
    logger.propagate = False
    logger.setLevel(logging.DEBUG)

    logs_dir = directory_manager.base_directories.LOGS_DIR
    log_file_path = logs_dir / "arservercontroller.log"

    if not logs_dir.exists():
        try:
            Path.mkdir(logs_dir, parents=True, exist_ok=True)
        except OSError as e:
            raise e

    file_handler = RotatingFileHandler(
        filename=log_file_path,
        maxBytes=1024 * 512,
        backupCount=10,
    )
    file_handler.setLevel(logging.DEBUG)

    console = Console(
        theme=Theme(
            {
                "logging.level.info": "blue bold",
                "logging.level.warning": "yellow bold",
                "logging.level.error": "red bold",
                "logging.level.debug": "green bold",
            }
        )
    )

    rich_handler = RichHandler(
        logging.DEBUG,
        rich_tracebacks=True,
        tracebacks_show_locals=True,
        markup=True,
        show_path=False,
        show_level=True,
        console=console,
    )

    rich_formatter = logging.Formatter(
        fmt=" [bold]%(name)s[/bold]:\t %(message)s",
        datefmt="%H:%M:%S",
    )

    file_formatter = logging.Formatter(
        fmt="%(asctime)s:%(msecs)d %(levelname)s\t%(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    for logger_name in ("uvicorn", "uvicorn.access", "uvicorn.error"):
        uvicorn_loggers = logging.getLogger(logger_name)

        uvicorn_loggers.handlers = []
        uvicorn_loggers.propagate = False
        uvicorn_loggers.addHandler(rich_handler)
        uvicorn_loggers.setLevel(logging.DEBUG)

    file_handler.setFormatter(file_formatter)
    rich_handler.setFormatter(rich_formatter)

    logger.addHandler(file_handler)
    logger.addHandler(rich_handler)

    return logger
