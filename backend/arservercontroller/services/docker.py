from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Annotated

import anyio
import docker
import docker.errors
from anyio import CancelScope
from anyio import from_thread as anyio_from_thread
from anyio import to_thread as anyio_to_thread
from docker.models.containers import Container
from docker.models.networks import Network
from docker.types import CancellableStream
from fastapi import Depends

from arservercontroller.api.dependencies import (
    DockerClientDep,
)
from arservercontroller.constants import AGENT_CONTAINER_NETWORK_NAME, directory_manager
from arservercontroller.schemas.server_config import ServerConfig
from arservercontroller.services.event_bus import event_bus
from arservercontroller.services.logger import get_logger
from arservercontroller.utils.errors import Err, Ok, Result

logger = get_logger(__name__)

type ProgressData = dict[str, str]
type OnProgressCb = Callable[[ProgressData], Awaitable[None]]

container_created_ev: str = "container_created"
container_removed_ev: str = "container_removed"
container_creation_failed_ev: str = "container_creation_failed"


class DockerContainerManager:
    """Handles direct Docker interactions with progress reporting and Result types."""

    def __init__(self, docker_client: docker.DockerClient):
        self.client: docker.DockerClient = docker_client

    def container_status(self, id: str) -> Result[str, Exception]:
        try:
            status = self.client.containers.get(id).status
            return Ok(status)

        except (docker.errors.NotFound, docker.errors.APIError) as e:
            logger.error(e)
            return Err(e)

    def is_container_running(self, id: str) -> bool:
        try:
            return self.client.containers.get(id).status == "running"
        except (docker.errors.NotFound, docker.errors.APIError) as e:
            logger.error(e)
            return False

    async def start_container(self, id: str) -> Result[bool, Exception]:
        try:
            container = self.client.containers.get(id)
            container.start()
            container.reload()
            return Ok(True)

        except (docker.errors.NotFound, docker.errors.APIError) as e:
            logger.error(e)
            return Err(e)

    async def stop_container(self, id: str) -> Result[bool, Exception]:
        try:
            container = self.client.containers.get(id)
            container.stop()
            return Ok(True)

        except (docker.errors.NotFound, docker.errors.APIError) as e:
            logger.error(e)
            return Err(e)

    async def restart_container(self, id: str) -> Result[bool, Exception]:
        try:
            container = self.client.containers.get(id)
            container.restart()
            return Ok(True)

        except (docker.errors.NotFound, docker.errors.APIError) as e:
            logger.error(e)
            return Err(e)

    def get_or_create_agent_network(self) -> Network | None:
        try:
            return self.client.networks.get(AGENT_CONTAINER_NETWORK_NAME)

        except docker.errors.NotFound:
            return self.client.networks.create(
                name=AGENT_CONTAINER_NETWORK_NAME, driver="bridge", check_duplicate=True
            )

        except docker.errors.APIError as e:
            logger.error(e)
            return None

    def get_container_network_ip(self, id: str) -> str | None:
        try:
            container = self.client.containers.get(id)
            container.reload()
            networks = container.attrs["NetworkSettings"]["Networks"]
            agent_net = networks.get(AGENT_CONTAINER_NETWORK_NAME)
            if not agent_net:
                return None

            return agent_net.get("IPAddress") or None

        except (docker.errors.NotFound, docker.errors.APIError, KeyError) as e:
            logger.error(e)
            return None

    async def create_server_container(
        self, image_name: str, config: ServerConfig, on_progress: OnProgressCb
    ) -> Result[Container, Exception]:
        """Create container and report progress."""

        await on_progress(
            {
                "phase": "docker",
                "step": "prepare",
                "message": f"Preparing container for server '{config.name}'",
            }
        )

        port_bindings = {
            f"{config.bind_port}/udp": config.bind_port,
            f"{config.a2s_port}/udp": config.a2s_port,
            f"{config.rcon_port}/tcp": config.rcon_port,
        }

        profile_host = str(
            directory_manager.controller_directories.DS_PROFILES_DIR / config.name
        )

        config_host = str(
            directory_manager.controller_directories.DS_CONFIGS_DIR
            / f"{config.name}.json"
        )

        config_host_base = Path(
            directory_manager.controller_directories.DS_CONFIGS_DIR / "base.json"
        )

        if config.name == "test-server":
            config_host = str(config_host_base)
        else:
            config_host_exists = Path(config_host).exists()
            if not config_host_exists:
                base_config = config_host_base.read_text("utf-8")
                config_host_path = Path(config_host)
                config_host_path.touch()
                _ = config_host_path.write_text(base_config, encoding="utf-8")

        volumes = {
            profile_host: {"bind": f"/home/{config.name}", "mode": "rw"},
            config_host: {"bind": f"/home/{config.name}/config.json", "mode": "rw"},
        }

        labels: dict[str, str] = {"com.arservercontroller": "true"}

        command_line: list[str] = [
            "-profile",
            f'"/home/{config.name}"',
            "-config",
            f'"/home/{config.name}/config.json"',
        ]
        command_line.extend(config.command_line or [])

        await on_progress(
            {
                "phase": "docker",
                "step": "create",
                "message": f"Creating container '{config.name}'",
            }
        )

        try:
            agent_net = self.get_or_create_agent_network()
            if not agent_net:
                raise RuntimeError("Can't create container with no agent network")

            container = self.client.containers.create(
                image=image_name,
                name=config.name,
                ports=port_bindings,
                network=agent_net.name,
                volumes=volumes,
                labels=labels,
                detach=True,
                environment=config.environment or {},
                command=command_line,
            )

            if container and container.id:
                _ = await event_bus.emit(
                    container_created_ev,
                    {"container_id": container.id, "server_id": config.id},
                )

                await on_progress(
                    {
                        "phase": "docker",
                        "step": "created",
                        "message": f"Container '{config.name}' created (id={container.id[:12]}...)",
                    }
                )

            return Ok(container)

        except Exception as err:
            _ = await event_bus.emit(
                container_creation_failed_ev, {"id": config.id, "error": err}
            )
            await on_progress(
                {
                    "phase": "docker",
                    "step": "error",
                    "message": f"Container creation failed: {str(err)}",
                    "error": "true",
                }
            )
            return Err(err)

    async def stream_container_logs(
        self,
        container: Container,
        on_log: OnProgressCb,
        tail: int = 100,
        follow: bool = True,
    ) -> None:
        """Stream real container logs using docker-py."""

        await on_log(
            {
                "phase": "docker",
                "step": "logs",
                "message": "Starting to stream container logs...",
            }
        )

        send_stream, receive_stream = anyio.create_memory_object_stream[bytes](
            max_buffer_size=100
        )
        stop_event = anyio.Event()

        def read_logs() -> None:
            buffer = b""
            log_stream: CancellableStream[bytes] = container.logs(
                stdout=True,
                stderr=True,
                tail=tail,
                follow=follow,
                stream=True,
                timestamps=True,
            )

            try:
                for chunk in log_stream:
                    if stop_event.is_set():
                        break

                    buffer += chunk
                    while b"\n" in buffer:
                        line, buffer = buffer.split(b"\n", 1)
                        _ = anyio_from_thread.run_sync(send_stream.send, line)

            finally:
                log_stream.close()
                _ = anyio_from_thread.run_sync(send_stream.send, b"")

        async with anyio.create_task_group() as task_group:
            with CancelScope() as _:
                task_group.start_soon(
                    anyio_to_thread.run_sync,
                    read_logs,
                    name="stream_container_logs::read_logs",
                )

                try:
                    async for line in receive_stream:
                        if line == b"":  # sentinel
                            break

                        decoded = line.decode("utf-8", errors="replace")
                        await on_log(
                            {
                                "phase": "docker",
                                "step": "logs",
                                "message": decoded,
                            }
                        )

                except anyio.get_cancelled_exc_class():
                    stop_event.set()
                    raise

                finally:
                    task_group.cancel_scope.cancel()

    async def remove_container(self, container_name: str) -> None:
        await self._try_cleanup_container(container_name)
        _ = await event_bus.emit(container_removed_ev, {"name": container_name})

    async def remove_container_by_id(self, container_id: str) -> None:
        await self._try_cleanup_container(container_id)
        _ = await event_bus.emit(container_removed_ev, {"id": container_id})

    async def _try_cleanup_container(self, container_name: str) -> None:
        """Optimistic cleanup, remove if exists, ignore most errors."""
        try:
            container = self.client.containers.get(container_name)
            container.remove(force=True, v=True)

        except docker.errors.NotFound, docker.errors.APIError:
            pass


_docker_manager: DockerContainerManager | None = None


def get_docker_manager(docker_client: DockerClientDep) -> DockerContainerManager:
    global _docker_manager
    if _docker_manager is None:
        _docker_manager = DockerContainerManager(docker_client)

    return _docker_manager


type DockerContainerManagerDep = Annotated[
    DockerContainerManager, Depends(get_docker_manager)
]
