import datetime
import logging
import sys
from logging.handlers import RotatingFileHandler
from typing import Optional

from arservercontroller.constants import BaseDirectories


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get the logger instance for the ARServerController project.
    Args:
        name: (Optional[str], optional): Is the name of the logger module to display.

    Returns:
        logging.Logger: The logger instance to use for logging.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(logging.DEBUG)

    file_handler = RotatingFileHandler(
        filename=f"{BaseDirectories().LOGS_DIR}/{datetime.datetime.now()}.log",
        maxBytes=1024 * 512,
        backupCount=10,
    )
    file_handler.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        fmt="%(asctime)s:%(msecs)d %(levelname)s\t%(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    stdout_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    if not logger.handlers:
        logger.addHandler(stdout_handler)
        logger.addHandler(file_handler)

    return logger
