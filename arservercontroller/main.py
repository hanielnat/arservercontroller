import os
import argparse
from fastapi import FastAPI
from arservercontroller.controller import ARServerController
from arservercontroller.configs import ServerConfigManager
from arservercontroller.logger import get_logger

logger = get_logger()

app: FastAPI = FastAPI()


def main(args: list[str] | str | None) -> int:
    parser = argparse.ArgumentParser(prog="arservercontroller")

    parser.add_argument("--serve")

    subparsers = parser.add_subparsers(dest="command")

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

    parsed: argparse.Namespace = parser.parse_args(args)
    if not parsed.command:
        parser.print_help()
        return 1

    config_manager = ServerConfigManager(os.curdir)
    controller = ARServerController(config_manager)

    # TODO: fazer uma maneira de iniciar o webserver por uma função global se '--serve' for passado
    if parsed.command == "--serve":
        try:
            ...
        except Exception as e:
            logger.error(e)
            return 1

    try:
        if parsed.command == "create":
            controller.create_server(parsed.name, {"udp": parsed.port}, parsed.config)
        elif parsed.command == "start":
            controller.start(parsed.name, parsed.user)
        elif parsed.command == "stop":
            controller.stop(parsed.name, parsed.user)
        elif parsed.command == "restart":
            controller.restart(parsed.name, parsed.user)
        elif parsed.command == "remove":
            controller.remove_server(parsed.name, parsed.remove_volumes)
        elif parsed.command == "list":
            print(controller.get_running_servers())
    except Exception as e:
        logger.error(e)
        return 1

    return 0


if __name__ == "__main__":
    import sys

    try:
        sys.exit(main(sys.argv[1:]))
    except Exception as e:
        logger.error("%s", e)
