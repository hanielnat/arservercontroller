import os
from argparse import ArgumentParser

import uvicorn
from fastapi import FastAPI

from sidecar.agent import lifespan, make_routes
from sidecar.logger_util import log_print

app: FastAPI = FastAPI(title="arservercontroller-agent-sidecar", lifespan=lifespan)
app.include_router(make_routes())


def _run(host: str, port: int, debug: bool):
    log_print("starting sidecar")
    uvicorn.run(app, host=host, port=port)


def main():
    parser = ArgumentParser(add_help=True)

    _ = parser.add_argument("-H", "--host", type=str, default="0.0.0.0")
    _ = parser.add_argument("-p", "--port", type=int, default=8080)
    args = parser.parse_args()

    debug = int(os.getenv("AGENT_DEBUG") or "0") != 0

    _run(args.host, args.port, debug)
