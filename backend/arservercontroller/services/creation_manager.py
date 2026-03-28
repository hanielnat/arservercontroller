import asyncio
import functools
from asyncio import CancelledError, Queue, Task
from typing import Annotated, cast
from uuid import UUID

import anyio
from docker.models.containers import Container
from fastapi import Depends, WebSocket

from arservercontroller.api.dependencies import DbSessionDep
from arservercontroller.constants import ServerStatusEnum
from arservercontroller.db.models.server import Server
from arservercontroller.schemas.server_config import ServerConfig
from arservercontroller.services.docker import (
    DockerContainerManager,
    DockerContainerManagerDep,
    OnProgressCb,
    ProgressData,
)
from arservercontroller.services.event_bus import EventData, event_bus
from arservercontroller.services.logger import get_logger
from arservercontroller.utils.errors import Result

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
        db: DbSessionDep,
    ):
        self.docker: DockerContainerManager = docker_manager
        self.db: DbSessionDep = db
        self._queues: dict[UUID, Queue[ProgressData]] = {}
        self._tasks: dict[UUID, Task[None]] = {}
        self._background_logs: dict[UUID, Task[None]] = {}

    def get_or_create_queue(self, server_id: UUID) -> Queue[ProgressData]:
        """Get or create log queue for a server."""
        if server_id not in self._queues:
            self._queues[server_id] = Queue()

        return self._queues[server_id]

    async def start_creation(
        self, server: Server, config: ServerConfig, image_name: str
    ) -> None:
        """Start async creation process for a server."""

        server_id = server.id
        queue = self.get_or_create_queue(server_id)

        async def progress(msg: ProgressData) -> None:
            await queue.put(msg)
            await event_bus.emit(creation_progress_ev, {"server_id": server_id, **msg})

        await event_bus.emit(
            creation_started_ev, {"server_id": server_id, "name": config.name}
        )

        task = asyncio.create_task(
            self._run_creation(server, config, image_name, progress)
        )
        self._tasks[server_id] = task

        task.add_done_callback(lambda _: self._cleanup_on_done(server_id))

    def _cleanup_on_done(self, server_id: UUID) -> None:
        """Remove tracking structures after task completes / is cancelled."""
        _ = self._tasks.pop(server_id, None)

    async def _handle_creation_failed(
        self, server: Server, container: Container | None
    ) -> None:
        if container:
            await self.docker._try_cleanup_container(  # pyright: ignore[reportPrivateUsage]
                str(server.server_config_data.name)
            )

        try:
            self.db.delete(server)
            self.db.commit()
        except Exception:
            pass

    async def _run_creation(
        self,
        server: Server,
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

                server.server_config_data = server.server_config_data.model_copy(
                    update={"status": ServerStatusEnum.EXITED}
                )

                self.db.commit()
                raise container_result.error()

            # success path
            container = container_result.value()
            server.server_config_data = server.server_config_data.model_copy(
                update={
                    "container_id": container.id,
                    "status": container.status,
                }
            )
            self.db.commit()

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
                {"server_id": server.id, "container_id": container.id},
            )

            # show container logs after creation
            # log_task = asyncio.create_task(
            #     self.docker.stream_container_logs(
            #         container, on_log=progress, follow=True
            #     )
            # )
            # self._tasks[server.id] = log_task

        except CancelledError:
            await progress(
                {
                    "phase": "manager",
                    "step": "cancel",
                    "message": "Creation cancelled by user",
                    "final": "true",
                }
            )

            await event_bus.emit(creation_cancelled_ev, {"server_id": server.id})
            await self._handle_creation_failed(server, container)

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
                creation_failed_ev, {"server_id": server.id, "error": str(exc)}
            )
            await self._handle_creation_failed(server, container)

    def cancel_creation(self, server_id: UUID) -> bool:
        task = self._tasks.get(server_id)
        if task is None or task.done():
            return False

        return task.cancel()

    async def stream_logs(self, server_id: UUID, websocket: WebSocket) -> None:
        """Stream logs to WebSocket until queue is closed or client disconnects."""
        queue = self.get_or_create_queue(server_id)
        send_stream, read_stream = anyio.create_memory_object_stream[ProgressData]()

        try:
            while not queue.empty():
                msg = await queue.get()
                if msg.get("final"):
                    break

                await send_stream.send(await queue.get())

            async for msg in read_stream:
                await websocket.send_json(msg)

        except Exception:
            pass

        finally:
            # TODO: cleanup queue
            pass


def get_server_creation_manager(
    docker_manager: DockerContainerManagerDep,
    db: DbSessionDep,
) -> ServerCreationManager:
    return ServerCreationManager(docker_manager, db)


ServerCreationManagerDep = Annotated[
    ServerCreationManager, Depends(get_server_creation_manager)
]
