from asyncio import CancelledError, Queue, Task, create_task
from typing import Annotated
from uuid import UUID

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
    OnProgressMessage,
)
from arservercontroller.services.logger import get_logger

logger = get_logger(__name__)


class ServerCreationManager:
    def __init__(
        self,
        docker_manager: DockerContainerManager,
        db: DbSessionDep,
    ):
        self.docker: DockerContainerManager = docker_manager
        self.db: DbSessionDep = db
        self._queues: dict[UUID, Queue[OnProgressMessage]] = {}
        self._tasks: dict[UUID, Task[None]] = {}
        self._background_logs: dict[UUID, Task[None]] = {}

    def get_or_create_queue(self, server_id: UUID) -> Queue[OnProgressMessage]:
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

        async def progress(msg: OnProgressMessage) -> None:
            await queue.put(msg)

        task = create_task(self._run_creation(server, config, image_name, progress))
        self._tasks[server_id] = task

        # fire and forget, caller doesn't wait
        task.add_done_callback(
            lambda t: self._handle_creation_done(server.name, server_id, t)
        )

    def _handle_creation_done(
        self, name: str, server_id: UUID, task: Task[None]
    ) -> None:
        self._cleanup_on_done(server_id, task)

    def _handle_failed_creation(self, server: Server) -> None:
        self.db.delete(server)
        self.db.commit()
        self.docker.try_cleanup_container(str(server.id))
        return

    async def _run_creation(
        self,
        server: Server,
        config: ServerConfig,
        image_name: str,
        progress: OnProgressCb,
    ) -> None:
        container: Container | None = None

        try:
            await progress(
                {
                    "phase": "manager",
                    "step": "start",
                    "message": f"Starting creation of server '{config.name}'",
                }
            )

            container = await self.docker.create_server_container(
                config, image_name, progress
            )

            if not container:
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
                self._handle_failed_creation(server)
                return

            # success path
            server.server_config_data = server.server_config_data.model_copy(
                update={"container_id": container.id, "status": container.status}
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

            # show container logs after creation
            log_task = create_task(
                self.docker.stream_container_logs(
                    container, on_log=progress, follow=True
                )
            )
            self._tasks[server.id] = log_task

        except CancelledError:
            await progress(
                {
                    "phase": "manager",
                    "step": "cancel",
                    "message": "Creation cancelled by user",
                    "final": "true",
                }
            )

            server.server_config_data = server.server_config_data.model_copy(
                update={"status": ServerStatusEnum.EXITED}
            )
            self.db.commit()

            if container and container.id:
                self._handle_failed_creation(server)

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

            server.server_config_data = server.server_config_data.model_copy(
                update={
                    "status": container.status if container else ServerStatusEnum.EXITED
                }
            )

            self.db.commit()
            self._handle_failed_creation(server)

    def cancel_creation(self, server_id: UUID) -> bool:
        task = self._tasks.get(server_id)
        if task is None or task.done():
            return False

        return task.cancel()

    def _cleanup_on_done(self, server_id: UUID, task: Task[None]) -> None:
        """Remove tracking structures after task completes / is cancelled."""
        _ = self._tasks.pop(server_id, None)

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
