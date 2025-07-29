import os
import sys
import argparse
from arservercontroller.controller import ARServerController
from arservercontroller.configs import ServerConfigManager
from arservercontroller.logger import get_logger

logger = get_logger()


def main() -> int:
    parser = argparse.ArgumentParser(prog="arservercontroller")

    parser.add_argument("--serve", action="store_true", help="Run the web server")

    # Server configuration arguments
    parser.add_argument(
        "--host",
        required=False,
        default="127.0.0.1",
        help="Host address to bind the server to",
    )
    parser.add_argument(
        "--port",
        required=False,
        type=int,
        default=8000,
        help="Port number to listen on",
    )

    subparsers = parser.add_subparsers(dest="command", required=False)

    create = subparsers.add_parser("create")
    create.add_argument("name")
    create.add_argument("--port", type=int, required=True)
    create.add_argument("--config", required=True)

    # Start/stop/restart commands
    for cmd in ["start", "stop", "restart"]:
        p = subparsers.add_parser(cmd)
        p.add_argument("name")
        p.add_argument("--user", required=True)

    remove = subparsers.add_parser("remove")
    remove.add_argument("name")
    remove.add_argument("--remove-volumes", action="store_true")

    subparsers.add_parser("list")

    parsed: argparse.Namespace = parser.parse_args(sys.argv[1:])
    if not parsed:
        parser.print_help()
        return 1

    config_manager = ServerConfigManager(os.curdir)
    controller = ARServerController(config_manager)

    # Start web server if '--serve' flag is passed
    if parsed.serve:
        try:
            from arservercontroller.webserver import run_server

            run_server(host=parsed.host, port=parsed.port)
            return 0
        except Exception as e:
            logger.error(e)
            return 1

    result: bool = True
    try:
        if parsed.command == "create":
            result = controller.create_server(
                parsed.name, {"udp": parsed.port}, parsed.config
            )
        elif parsed.command == "start":
            result = controller.start(parsed.name, parsed.user)
        elif parsed.command == "stop":
            result = controller.stop(parsed.name, parsed.user)
        elif parsed.command == "restart":
            result = controller.restart(parsed.name, parsed.user)
        elif parsed.command == "remove":
            result = controller.remove_server(parsed.name, parsed.remove_volumes)
        elif parsed.command == "list":
            logger.info(controller.get_running_servers())
    except Exception as e:
        logger.error(e)
        return 1

    if not result:
        return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        logger.error("%s", e)
