import asyncio
import uuid
from asyncio import Queue
from collections.abc import AsyncIterable
from typing import Any

from fastapi import APIRouter, HTTPException, Request, WebSocket, status
from fastapi.sse import EventSourceResponse, ServerSentEvent
from pydantic import UUID4

from arservercontroller.api.dependencies import DbSessionDep
from arservercontroller.db.models.server import Server
from arservercontroller.schemas.server import ServerOut, ServersOut
from arservercontroller.schemas.server_config import (
    ServerConfig,
    ServerConfigCreate,
    ServerConfigUpdate,
)
from arservercontroller.services.controller import ServerControllerDep
from arservercontroller.services.creation_manager import ServerCreationManagerDep

server_router = APIRouter(prefix="/servers", tags=["server"])


def find_server_by_id(id: UUID4, db: DbSessionDep) -> Server:
    model = db.get(Server, id)
    if not model:
        raise HTTPException(404, "Server not found.")

    return model


@server_router.get("/")
async def get_servers(db: DbSessionDep, offset: int = 0, limit: int = 10) -> ServersOut:
    servers = db.query(Server).offset(offset).limit(limit).all()
    servers_out = [ServerOut.model_validate(server) for server in servers]
    return ServersOut(data=servers_out, count=len(servers_out))


@server_router.post("/", status_code=status.HTTP_201_CREATED)
async def add_server(
    server_config: ServerConfigCreate,
    server_controller: ServerControllerDep,
) -> ServerConfig:
    server_id = uuid.uuid4()

    config_dict = server_config.model_dump()
    config_dict.update({"id": server_id, "container_id": ""})
    server_config_data = ServerConfig.model_validate(config_dict)

    out_db = Server(id=server_id, name=server_config.name)
    out_db.serverConfigData = server_config_data

    try:
        config = await server_controller.add_server(out_db)

    except Exception as err:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Failed to start server creation: {str(err)}",
        )

    return config


@server_router.post("/{server_id}/cancel")
async def cancel_server_creation(
    server_id: UUID4,
    server_controller: ServerControllerDep,
) -> dict[str, bool]:
    cancelled = await server_controller.cancel_creation(server_id)
    if not cancelled:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "No active creation task found for this server",
        )

    return {"cancelled": True}


@server_router.websocket("/ws/{server_id}/creation")
async def websocket_server_creation_logs(
    websocket: WebSocket,
    server_id: UUID4,
    creation_manager: ServerCreationManagerDep,
) -> None:
    await websocket.accept()

    try:
        await creation_manager.stream_logs(server_id, websocket)

    except Exception:
        # client disconnect is normal
        pass

    finally:
        await websocket.close()


@server_router.patch("/{server_id}")
async def update_server(
    server_id: UUID4,
    new_server: ServerConfigUpdate,
    db: DbSessionDep,
) -> ServerOut:
    model = find_server_by_id(server_id, db)

    update_data = new_server.model_dump(exclude_unset=True)
    update_data.update({"id": server_id, "container_id": model})

    db.commit()
    db.refresh(model)
    return ServerOut.model_validate(model)


@server_router.delete("/{server_id}")
async def delete_server(
    server_id: UUID4, db: DbSessionDep, server_controller: ServerControllerDep
) -> None:
    model = find_server_by_id(server_id, db)

    result, err = await server_controller.remove_server(model)
    if not result:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Failed to delete server: {err}",
        )


@server_router.post("/{server_id}/start")
async def start_server(
    server_id: UUID4,
    db: DbSessionDep,
    server_controller: ServerControllerDep,
) -> None:
    model = find_server_by_id(server_id, db)
    result, err = await server_controller.start(model)
    if not result:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"{err}")


@server_router.post("/{server_id}/stop")
async def stop_server(
    server_id: UUID4, db: DbSessionDep, server_controller: ServerControllerDep
) -> None:
    model = find_server_by_id(server_id, db)
    result, err = await server_controller.stop(model)
    if not result:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"{err}")


@server_router.post("/{server_id}/restart")
async def restart_server(
    server_id: UUID4, db: DbSessionDep, server_controller: ServerControllerDep
) -> None:
    model = find_server_by_id(server_id, db)
    result, err = await server_controller.restart(model)
    if not result:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"{err}")


@server_router.post("/{server_id}/config")
async def reload_config(
    server_id: UUID4,
    reforger_config: dict[str, Any],
    db: DbSessionDep,
    server_controller: ServerControllerDep,
):
    model = find_server_by_id(server_id, db)
    result, err = await server_controller.reload_config(model, reforger_config)

    if not result:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"{err}")


@server_router.get("/{server_id}/logs/stream", response_class=EventSourceResponse)
async def stream_logs(
    server_id: UUID4, db: DbSessionDep, server_controller: ServerControllerDep
) -> AsyncIterable[ServerSentEvent]:
    model = find_server_by_id(server_id, db)
    yield server_controller.stream_reforger_logs(model)


@server_router.get(
    "/{server_id}/container/logs/stream", response_class=EventSourceResponse
)
async def stream_container_logs(
    request: Request,
    server_id: UUID4,
    db: DbSessionDep,
    server_controller: ServerControllerDep,
    tail: int = 100,
    follow: bool = True,
    show_timestamp: bool = False,
) -> AsyncIterable[ServerSentEvent]:
    model = find_server_by_id(server_id, db)
    queue: Queue[dict[str, Any] | None] = Queue()

    async def on_log(data: dict[str, Any]) -> None:
        if await request.is_disconnected():
            return
        await queue.put(data)

    task = asyncio.create_task(
        server_controller.stream_container_logs(
            model, queue, on_log, tail, follow, show_timestamp
        )
    )

    try:
        while True:
            if await request.is_disconnected():
                break

            item = await queue.get()
            if item is None:
                break

            message = item.get("message", "")
            event_name = "error" if item.get("error") else "log"

            yield ServerSentEvent(
                raw_data=message,
                event=event_name,
            )
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
