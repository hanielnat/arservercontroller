import datetime
import logging
import sys
from typing import Optional

from arservercontroller.constants import BaseDirectories

logger = logging.getLogger("arservercontroller")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.INFO)

file_handler = logging.FileHandler(
    f"{BaseDirectories.LOGS_DIR}/{datetime.datetime.now()}.log"
)
file_handler.setLevel(logging.INFO)

formatter = logging.Formatter(
    fmt="%(asctime)s:%(msecs)d %(levelname)s %(name)s   : %(message)s",
    datefmt="%H:%M:%S",
)

handler.setFormatter(formatter)

if not logger.handlers:
    logger.addHandler(handler)
    logger.addHandler(file_handler)


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get the logger instance for the ARServerController project.

    Returns:
        logging.Logger: The logger instance to use for logging.
    """
    return logging.getLogger(name)
