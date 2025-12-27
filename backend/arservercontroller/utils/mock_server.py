from logging import Logger

from arservercontroller.constants import directory_manager
from arservercontroller.utils.configs import make_default_server_config


def setup_test_server(logger: Logger, config_name: str = "base") -> None:
    logger.debug("Creating test server config...")

    result, err = make_default_server_config(config_name)
    if not result:
        logger.exception(err)
        raise err if err else Exception

    args = f"-profile /home/reforger -bindPort 2555 -a2sPort 18989 -config /data/controller/ds_configs/{config_name}.json"
    args_path = directory_manager.controller_directories.CONTROLLER_DIR / "args.txt"
    logger.debug("Creating test server `args.txt` file at '%s'...", args_path)
    logger.debug("Test server arguments: '%s'", args)

    try:
        with open(args_path, "w") as f:
            f.write(args)

        logger.debug("Test server `args.txt` file created")
    except (IOError, OSError) as e:
        logger.exception(e)
        raise e

    logger.debug("Test server setup done")
