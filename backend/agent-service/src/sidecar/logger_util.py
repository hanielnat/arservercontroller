import uvicorn

logger = uvicorn.config.logger


def log_print(msg: object, *args: object):
    logger.info(f"[agent] {msg}" % args)


def eprint(msg: object, *args: object):
    logger.error(f"[agent] {msg}" % args)
