import os
import subprocess
from contextlib import asynccontextmanager
from pathlib import Path
from queue import Queue
from threading import Lock, Thread
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, FastAPI, HTTPException

from sidecar.logger_util import eprint, log_print


class AgentService:
    REFORGER: str = os.getenv("REFORGER") or "/reforger/ArmaReforgerServer"
    AGENT_DEBUG: bool = int(os.getenv("AGENT_DEBUG") or "0") != 0
    MOCK_SUBPROCESS_CMD: str = (
        os.getenv("MOCK_SUBPROCESS_CMD")
        or "uv run python src/sidecar/mock_subprogram.py"
    )

    def __init__(self):
        self.server_pid: int = -1
        self.server_proc: subprocess.Popen[str] | None = None
        self._server_mutex: Lock = Lock()

        self._stdout_contents: list[str] = []
        self._stdout_queue: Queue[str | None] = Queue()

    def start_server(self, server_launch_options: list[str]):
        with self._server_mutex:
            if self.server_proc is not None and self.server_proc.poll() is None:
                raise HTTPException(400, "server already running")

            result = self._proc_open(server_launch_options)
            if not result:
                raise HTTPException(500, "subprocess failed to start properly")

            self.server_proc = result
            self.server_pid = result.pid
            self._stdout_contents.clear()

            self._start_stdout_reader()

            return {"pid": self.server_pid, "status": "started"}

    def _proc_open(self, launch_options: list[str]) -> subprocess.Popen[str] | None:
        try:
            args: list[str] = (
                self.MOCK_SUBPROCESS_CMD.split()
                if self.AGENT_DEBUG
                else self.REFORGER.split()
            )
            args.extend(launch_options)

            proc = subprocess.Popen(
                args,
                text=True,
                bufsize=1,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                start_new_session=True,
            )

            if not proc.stdout:
                eprint("stdout pipe is None")
                proc.kill()
                proc.wait()
                return

            self.server_pid = proc.pid
            return proc

        except (OSError, subprocess.SubprocessError, Exception) as e:  # noqa: BLE001
            eprint(f"error starting server process: {e}")
            raise HTTPException(
                status_code=500, detail=f"error starting server process {e}"
            )

    def _start_stdout_reader(self):
        def reader():
            assert self.server_proc is not None
            assert self.server_proc.stdout is not None

            try:
                for line in iter(self.server_proc.stdout.readline, ""):
                    if not line:
                        break

                    self._stdout_contents.append(line)
                    self._stdout_queue.put(line)

                    log_print(line.rstrip())
            except Exception as e:  # noqa: BLE001
                eprint(f"stdout reader error: {e}")
            finally:
                self._stdout_queue.put(None)

        self.reader_thread = Thread(
            target=reader, daemon=True, name="server-stdout-reader"
        )
        self.reader_thread.start()

    def stop_server(self):
        with self._server_mutex:
            if self.server_proc is None or self.server_proc.poll() is not None:
                raise HTTPException(400, "server is not running")

            self.server_proc.terminate()
            try:
                self.server_proc.wait(timeout=10.0)
            except subprocess.TimeoutExpired:
                self.server_proc.kill()
                self.server_proc.wait()

            if self.reader_thread and self.reader_thread.is_alive():
                self.reader_thread.join(timeout=2)

            pid = self.server_pid
            self.server_proc = None
            self.server_pid = -1
            return {"pid": pid, "status": "stopped"}

    def reload_config(
        self, server_launch_options: list[str], config_path: str, config: dict[str, Any]
    ):
        try:
            # prevent creating a config file if passed as relational path, ex: "config.json"
            path = Path(config_path) if Path(config_path).is_absolute() else None
            if not path:
                raise ValueError("Only absolute paths to config file are allowed")

            with open(path, "w", encoding="utf-8") as file:
                import json

                count = file.write(json.dumps(config, indent=4, skipkeys=True))
                log_print(f"written '{count}' characters to '{config_path}'")

        except FileNotFoundError:
            return HTTPException(404, f"Config file not found: '{config_path}'")

        except OSError as e:
            return HTTPException(500, f"Unexpected OSError: {e}")

        log_print(f"restarting server with options: {server_launch_options}")
        self.stop_server()
        self.start_server(server_launch_options)

    def get_logs(self, last_n: int = 100) -> list[str]:
        return self._stdout_contents[-last_n:]


_agent_service: AgentService | None = None


def _get_agent_service() -> AgentService:
    global _agent_service
    if not _agent_service:
        _agent_service = AgentService()

    return _agent_service


def make_routes() -> APIRouter:
    type AgentServiceDep = Annotated[AgentService, Depends(_get_agent_service)]
    router = APIRouter()

    @router.get("/health")
    async def healthcheck():
        return "OK"

    @router.post("/start")
    async def start_server(service: AgentServiceDep, launch_options: list[str]):
        return service.start_server(launch_options)

    @router.post("/stop")
    async def stop_server(service: AgentServiceDep):
        return service.stop_server()

    @router.post("/reload")
    async def reload_config(
        service: AgentServiceDep,
        launch_options: list[str],
        config_path: Annotated[str, Body()],
        config: dict[str, Any],
    ):
        return service.reload_config(launch_options, config_path, config)

    @router.get("/logs")
    async def get_logs(service: AgentServiceDep, last_n: int = 100):
        return {"lines": service.get_logs(last_n)}

    @router.get("/status")
    async def status(service: AgentServiceDep):
        is_running = (
            service.server_proc is not None and service.server_proc.poll() is None
        )
        return {
            "running": is_running,
            "pid": service.server_pid if is_running else None,
        }

    return router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    service = _get_agent_service()
    if service.server_proc and service.server_proc.poll() is None:
        service.stop_server()
