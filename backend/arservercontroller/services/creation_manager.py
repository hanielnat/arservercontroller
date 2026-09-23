import asyncio
from asyncio import CancelledError, Queue, Task
from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from docker.models.containers import Container
from fastapi import Depends, WebSocket
from sqlalchemy.orm import Session, sessionmaker

from arservercontroller.constants import ServerStatusEnum
from arservercontroller.db.models.server import Server
from arservercontroller.db.session import SessionLocal
from arservercontroller.schemas.server_config import ServerConfig
from arservercontroller.services.docker import (
    DockerContainerManager,
    DockerContainerManagerDep,
    OnProgressCb,
    ProgressData,
)
from arservercontroller.services.event_bus import event_bus
from arservercontroller.services.logger import get_logger

logger = get_logger(__name__)


creation_progress_ev = "creation_progress"
creation_started_ev = "creation_started"
creation_completed_ev = "creation_completed"
creation_cancelled_ev = "creation_cancelled"
creation_failed_ev = "creation_failed"


class ServerCreationManager:
    def __init__(
        self,
        docker_manager: DockerContainerManager,
        session_factory: Callable[[], Session] | sessionmaker[Session] = SessionLocal,
    ):
        self.docker: DockerContainerManager = docker_manager
        self._session_factory: Callable[[], Session] | sessionmaker[Session] = (
            session_factory
        )
        self._queues: dict[UUID, Queue[ProgressData]] = {}
        self._tasks: dict[UUID, Task[None]] = {}
        self._background_logs: dict[UUID, Task[None]] = {}

    def get_or_create_queue(self, server_id: UUID) -> Queue[ProgressData]:
        """Get or create log queue for a server."""
        if server_id not in self._queues:
            self._queues[server_id] = Queue()

        return self._queues[server_id]

    async def start_creation(
        self, server_id: UUID, config: ServerConfig, image_name: str
    ) -> None:
        """Start async creation process for a server."""

        queue = self.get_or_create_queue(server_id)

        async def progress(msg: ProgressData) -> None:
            await queue.put(msg)
            await event_bus.emit(creation_progress_ev, {"server_id": server_id, **msg})

        await event_bus.emit(
            creation_started_ev, {"server_id": server_id, "name": config.name}
        )

        task = asyncio.create_task(
            self._run_creation(server_id, config, image_name, progress)
        )
        self._tasks[server_id] = task

        task.add_done_callback(lambda _: self._cleanup_on_done(server_id))

    def _cleanup_on_done(self, server_id: UUID) -> None:
        """Remove tracking structures after task completes / is cancelled."""
        _ = self._tasks.pop(server_id, None)

    async def _handle_creation_failed(
        self, server_id: UUID, container: Container | None
    ) -> None:
        if container and container.id:
            await self.docker._try_cleanup_container(  # pyright: ignore[reportPrivateUsage]
                container.id
            )

        try:
            with self._session_factory() as db:
                server: Server | None = db.get(Server, server_id)
                if not server:
                    return

                db.delete(server)
                db.commit()
        except Exception as e:
            logger.exception(e)

    async def _run_creation(
        self,
        server_id: UUID,
        config: ServerConfig,
        image_name: str,
        progress: OnProgressCb,
    ) -> None:
        await progress(
            {
                "phase": "manager",
                "step": "start",
                "message": f"Starting creation of server '{config.name}'",
            }
        )

        container: Container | None = None
        try:
            container_result = await self.docker.create_server_container(
                image_name, config, progress
            )

            if not container_result:
                await progress(
                    {
                        "phase": "manager",
                        "step": "fail",
                        "message": "Container creation failed",
                        "error": "true",
                        "final": "true",
                    }
                )

                with self._session_factory() as db:
                    db_server: Server | None = db.get(Server, server_id)
                    if db_server and db_server.serverConfigData:
                        db_server.serverConfigData = (
                            db_server.serverConfigData.model_copy(
                                update={"status": ServerStatusEnum.EXITED}
                            )
                        )
                        db.commit()

                raise container_result.error()

            # success path
            container = container_result.value()

            # get container IP to call the agent `/start` endpoint
            container.reload()

            ip_address = "127.0.0.1"

            await progress(
                {
                    "phase": "manager",
                    "step": "agent_start",
                    "message": f"Calling agent /start inside container ({ip_address})",
                }
            )

            # start the container first and update it's status to running
            if container.id:
                started = await self.docker.start_container(container.id)
                if not started:
                    logger.exception(started.error)
                    raise RuntimeError(f"Cannot start container: {started.error}")

                with self._session_factory() as db:
                    db_server: Server | None = db.get(Server, server_id)
                    if db_server and db_server.serverConfigData:
                        db_server.serverConfigData = (
                            db_server.serverConfigData.model_copy(
                                update={"status": ServerStatusEnum.RUNNING}
                            )
                        )
                        db.commit()

            # import AgentClient and ask to start server
            from arservercontroller.services.agent_client import AgentClient

            agent = AgentClient(ip_address)
            try:
                logger.info("Waiting for container agent to be ready...")
                await asyncio.sleep(5.0)

                if not await agent.is_ready():
                    logger.fatal(
                        "Container agent is not present or running, it must be running before starting the server."
                    )

                # call agent /start with launch options
                agent_res = await agent.start_server(
                    launch_options=config.command_line or []
                )
                await progress(
                    {
                        "phase": "manager",
                        "step": "agent_started",
                        "message": f"Agent started server process with PID {agent_res.get('pid')}",
                    }
                )

            except Exception as e:
                logger.error(f"Failed to start server process via agent: {e}")
                await progress(
                    {
                        "phase": "manager",
                        "step": "agent_error",
                        "message": f"Failed to start server via agent: {e!s}",
                        "error": "true",
                    }
                )
                raise

            finally:
                await agent.close()

            with self._session_factory() as db:
                server: Server | None = db.get(Server, server_id)
                if not server or not server.serverConfigData:
                    raise ValueError(f"Server '{server_id}' not found during creation")

                server.serverConfigData = server.serverConfigData.model_copy(
                    update={
                        "container_id": container.id,
                        "status": container.status,
                    }
                )
                db.commit()

            await progress(
                {
                    "phase": "manager",
                    "step": "success",
                    "message": "Server creation completed successfully",
                    "final": "true",
                }
            )

            await event_bus.emit(
                creation_completed_ev,
                {"server_id": server_id, "container_id": container.id},
            )

        except CancelledError:
            await progress(
                {
                    "phase": "manager",
                    "step": "cancel",
                    "message": "Creation cancelled by user",
                    "final": "true",
                }
            )

            await event_bus.emit(creation_cancelled_ev, {"server_id": server_id})
            await self._handle_creation_failed(server_id, container)

        except Exception as exc:
            await progress(
                {
                    "phase": "manager",
                    "step": "error",
                    "message": f"Unexpected error during creation: {str(exc)}",
                    "error": "true",
                    "final": "true",
                }
            )

            await event_bus.emit(
                creation_failed_ev, {"server_id": server_id, "error": str(exc)}
            )
            await self._handle_creation_failed(server_id, container)

    def cancel_creation(self, server_id: UUID) -> bool:
        task = self._tasks.get(server_id)
        if task is None or task.done():
            return False

        return task.cancel()

    async def stream_logs(self, server_id: UUID, websocket: WebSocket) -> None:
        """Stream logs to WebSocket until queue is closed or client disconnects."""
        queue = self.get_or_create_queue(server_id)

        try:
            while True:
                msg = await queue.get()
                await websocket.send_json(msg)
                if msg.get("final"):
                    break

        except Exception:
            pass


_server_creation_manager: ServerCreationManager | None = None


def get_server_creation_manager(
    docker_manager: DockerContainerManagerDep,
) -> ServerCreationManager:
    global _server_creation_manager
    if _server_creation_manager is None:
        _server_creation_manager = ServerCreationManager(docker_manager)

    return _server_creation_manager


type ServerCreationManagerDep = Annotated[
    ServerCreationManager, Depends(get_server_creation_manager)
]
