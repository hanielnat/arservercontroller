import logging
import sys

logger = logging.getLogger("arservercontroller")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.INFO)

formatter = logging.Formatter(
    "%(asctime)s:%(msecs)d %(levelname)s %(funcName)s   : %(message)s", "%H:%M:%S"
)

handler.setFormatter(formatter)

if not logger.handlers:
    logger.addHandler(handler)


def get_logger() -> logging.Logger:
    """Get the logger instance for the ARServerController project.

    Returns:
        logging.Logger: The logger instance to use for logging.
    """
    return logger
