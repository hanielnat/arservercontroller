import asyncio
from asyncio import Queue
from pathlib import Path
from typing import Annotated, Any
from uuid import UUID

import docker
import docker.errors
from fastapi import Depends

from arservercontroller.api.dependencies import DbSessionDep, DockerClientDep
from arservercontroller.constants import (
    ServerStatusEnum,
    directory_manager,
)
from arservercontroller.db.models.server import Server
from arservercontroller.schemas.server_config import ServerConfig
from arservercontroller.services.creation_manager import (
    ServerCreationManagerDep,
)
from arservercontroller.services.docker import (
    DockerContainerManagerDep,
    OnProgressCb,
)
from arservercontroller.services.logger import get_logger

logger = get_logger(__name__)

ControllerResult = tuple[bool, str]


class ServerController:
    def __init__(
        self,
        db: DbSessionDep,
        docker_client: DockerClientDep,
        docker_manager: DockerContainerManagerDep,
        creation_manager: ServerCreationManagerDep,
    ) -> None:
        self.DEFAULT_CONTAINER_IMAGE_DIR: Path = (
            directory_manager.base_directories.ROOT_DIR / "Reforger.Dockerfile"
        )
        self.DEFAULT_CONTAINER_IMAGE_NAME: str = "arserver-mock:latest"

        self._db = db
        self._docker = docker_client
        self.docker_manager = docker_manager
        self.creation_manager = creation_manager
        self._ping()

    def _ping(self):
        try:
            self._docker.ping()
        except docker.errors.APIError:
            logger.error(
                "Error initializing docker client. Operations with container will fail beyond this point."
            )

    async def add_server(
        self,
        server: Server,
    ) -> ServerConfig:
        if not server.serverConfigData:
            raise ValueError("Server config data is None")

        config: ServerConfig = server.serverConfigData

        self._db.add(server)
        self._db.commit()
        self._db.refresh(server)

        await self.creation_manager.start_creation(
            server.id, config, self.DEFAULT_CONTAINER_IMAGE_NAME
        )

        logger.info(
            "Server creation started for '%s' (id: '%s')", config.name, server.id
        )

        out_server = ServerConfig.model_validate(obj=server.serverConfigData)

        return out_server

    async def remove_server(self, model: Server) -> ControllerResult:
        container_id = model.serverConfigData.container_id
        try:
            await self.stop(model)

            logger.info(f"Removing container (id='{container_id[:16]}...')")
            await self.docker_manager.remove_container_by_id(container_id)
            logger.info("Container removed")

            self._db.delete(model)
            self._db.commit()

            logger.info(f"Server removed (id='{model.id}')")
            return True, ""

        except Exception as e:
            msg = f"Error removing server (id='{model.id}')"
            logger.error(f"{msg}: {e}")
            return False, f"{msg}"

    async def cancel_creation(self, server_id: UUID) -> bool:
        try:
            cancelled = self.creation_manager.cancel_creation(server_id)
            if cancelled:
                logger.info("Creation cancelled for server id '%s'", server_id)

        except Exception as err:
            logger.exception(err)
            return False

        return cancelled

    async def reload_config(
        self, model: Server, config: dict[str, Any]
    ) -> ControllerResult:
        container_id = model.serverConfigData.container_id

        # get container IPAddress to call `/reload` endpoint
        ip_address: str = (
            self.docker_manager.get_container_network_ip(container_id) or ""
        )
        if len(ip_address) == 0:
            logger.error("Container IPAddress is empty, retrieval failed")

        # import AgentClient and ask to reload the server with new config and launch options
        from arservercontroller.services.agent_client import AgentClient

        agent = AgentClient(ip_address)
        try:
            # prepare payload
            config_path = f"/home/{model.serverConfigData.name}/config.json"
            command_line: list[str] = [
                "-profile",
                f"/home/{model.serverConfigData.name}",
                "-config",
                config_path,
            ]
            command_line.extend(model.serverConfigData.command_line or [])

            await agent.reload_config(command_line, config_path, config)

            logger.info(f"Server config reloaded (server_id='{model.id}')")
            return True, ""

        except Exception as e:
            msg = "Failed reload reforger server config via agent"
            logger.error(f"{msg}: {e}")
            return False, f"{msg}: {e}"

        finally:
            await agent.close()

    async def stream_reforger_logs(self, model: Server):
        container_id = model.serverConfigData.container_id
        container = self._docker.containers.get(container_id)
        raise NotImplementedError

    async def stream_container_logs(
        self,
        model: Server,
        queue: Queue[dict[str, Any] | None],
        on_log: OnProgressCb,
        tail: int,
        follow: bool,
        show_timestamp: bool,
    ):
        container_id = model.serverConfigData.container_id
        container = self._docker.containers.get(container_id)

        try:
            await self.docker_manager.stream_container_logs(
                container,
                on_log=on_log,
                tail=tail,
                follow=follow,
                show_timestamp=show_timestamp,
            )
        except Exception as e:
            await queue.put(
                {
                    "phase": "error",
                    "step": "logs",
                    "message": str(e),
                    "error": "true",
                }
            )
        finally:
            await queue.put(None)  # sentinel

    async def start(self, model: Server) -> ControllerResult:
        container_id = model.serverConfigData.container_id

        # try to start container
        try:
            logger.info(f"Starting container of Server '{model.id}'...")
            started = await self.docker_manager.start_container(container_id)
            if not started:
                raise RuntimeError(started.error())

            # get container IP to call the agent `/start` endpoint
            ip_address: str = (
                self.docker_manager.get_container_network_ip(container_id) or ""
            )
            if len(ip_address) == 0:
                logger.error("Container IPAddress is empty, retrieval failed")

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

                command_line: list[str] = [
                    "-profile",
                    f'"/home/{model.serverConfigData.name}"',
                    "-config",
                    f'"/home/{model.serverConfigData.name}/config.json"',
                ]
                command_line.extend(model.serverConfigData.command_line or [])

                await agent.start_server(command_line)

            except Exception as e:
                msg = "Failed start server process via agent"
                logger.error(f"{msg}: {e}")
                return False, f"{msg}: {e}"

            finally:
                await agent.close()

            # update container status on db to running or use dead as fallback
            model.serverConfigData = model.serverConfigData.model_copy(
                update={
                    "status": self.docker_manager.container_status(
                        container_id
                    ).value_or(ServerStatusEnum.DEAD)
                }
            )
            self._db.commit()
            logger.info(f"Container started of server '{model.id}'")
            return True, ""

        except (docker.errors.APIError, Exception) as e:
            msg = f"Error starting container (id='{container_id[:16]}...')"
            logger.error(msg)
            return False, f"{msg}: {e}"

    async def stop(self, model: Server) -> ControllerResult:
        container_id = model.serverConfigData.container_id

        try:
            if not self.docker_manager.is_container_running(container_id):
                raise RuntimeError(
                    f"Server container is not running (server_id='{model.id}', container_id='{container_id[:16]}...')"
                )

            logger.info(f"Stopping container of server '{model.id}'...")

            # get container IP to call the agent `/stop` endpoint
            ip_address: str = (
                self.docker_manager.get_container_network_ip(container_id) or ""
            )
            if len(ip_address) == 0:
                logger.error("Container IPAddress is empty, retrieval failed")

            # stop via agent first if container is running
            from arservercontroller.services.agent_client import AgentClient

            agent = AgentClient(ip_address)
            try:
                await agent.stop_server()
            except (
                Exception
            ) as e:  # log error and proceed to stop container as fallback
                logger.error(f"Failed to stop server process via agent: {e}")
            finally:
                await agent.close()

            stopped = await self.docker_manager.stop_container(container_id)
            if not stopped:
                logger.exception(stopped.error())
                raise RuntimeError(stopped.error())

            # update container status on db to exited or use dead as fallback
            model.serverConfigData = model.serverConfigData.model_copy(
                update={
                    "status": self.docker_manager.container_status(
                        container_id
                    ).value_or(ServerStatusEnum.DEAD)
                }
            )
            self._db.commit()
            logger.info(f"Container of server '{model.id}' stopped.")
            return True, ""

        except (docker.errors.APIError, Exception) as e:
            msg = f"Error stopping container '{container_id[:16]}...'"
            logger.error(f"{msg}: {e}")
            return False, msg

    async def restart(self, model: Server) -> ControllerResult:
        container_id = model.serverConfigData.container_id

        try:
            logger.info(f"Restarting container of Server '{model.id}'...")

            # get container IP to call the agent `/stop` endpoint
            ip_address: str = (
                self.docker_manager.get_container_network_ip(container_id) or ""
            )
            if len(ip_address) == 0:
                logger.error("Container IPAddress is empty, retrieval failed")

            from arservercontroller.services.agent_client import AgentClient

            # stop via agent before restart
            try:
                agent = AgentClient(ip_address)
                await agent.stop_server()
            except Exception as e:  # log error and proceed anyways as it's still possible to restart the container
                logger.error(f"Error stopping server via agent prior to restart: {e}")
            finally:
                await agent.close()

            # actual container restart
            restarted = await self.docker_manager.restart_container(container_id)
            if not restarted:
                logger.error(restarted.error())
                raise restarted.error()

            model.serverConfigData = model.serverConfigData.model_copy(
                update={
                    "status": self.docker_manager.container_status(
                        container_id
                    ).value_or(ServerStatusEnum.DEAD)
                }
            )

            try:
                agent = AgentClient(ip_address)

                # wait for agent to be ready and start it again after restart
                await asyncio.sleep(5.0)
                if not await agent.is_ready():
                    msg = "Container agent was not ready to accept requests in time"
                    logger.error(msg)
                    raise TimeoutError(msg)

                command_line: list[str] = [
                    "-profile",
                    f'"/home/{model.serverConfigData.name}"',
                    "-config",
                    f'"/home/{model.serverConfigData.name}/config.json"',
                ]
                command_line.extend(model.serverConfigData.command_line or [])

                await agent.start_server(command_line)

            except Exception as e:
                logger.error(
                    f"Failed to start server via agent after container restart: {e}"
                )
                raise
            finally:
                await agent.close()

            model.serverConfigData = model.serverConfigData.model_copy(
                update={
                    "status": self.docker_manager.container_status(
                        container_id
                    ).value_or(ServerStatusEnum.DEAD)
                }
            )
            self._db.refresh(model)
            self._db.commit()

            logger.info(f"Container of Server '{container_id[:16]}...' restarted.")
            return True, ""

        except Exception as e:
            msg = f"Error restarting container '{container_id[:16]}...'"
            logger.error(f"{msg}: {e}")

            # try to stop the container if it failed to restart correctly
            await self.docker_manager.stop_container(container_id)
            return False, msg


def get_server_controller(
    db: DbSessionDep,
    docker_client: DockerClientDep,
    docker_manager: DockerContainerManagerDep,
    creation_manager: ServerCreationManagerDep,
) -> ServerController:
    return ServerController(db, docker_client, docker_manager, creation_manager)


type ServerControllerDep = Annotated[ServerController, Depends(get_server_controller)]
