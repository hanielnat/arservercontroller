import uuid

from arservercontroller.api.dependencies import DbSessionDep, ModeratorOrAdminDep
from arservercontroller.db.models.server import Server
from arservercontroller.schemas.server import ServerOut, ServersOut
from arservercontroller.schemas.server_config import (
    ServerConfig,
    ServerConfigCreate,
    ServerConfigUpdate,
)
from arservercontroller.services.controller import ServerControllerDep
from arservercontroller.services.creation_manager import ServerCreationManagerDep
from fastapi import APIRouter, HTTPException, WebSocket, status
from pydantic import UUID4

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


@server_router.post("/")
async def add_server(
    server_config: ServerConfigCreate,
    server_controller: ServerControllerDep,
) -> ServerConfig:
    server_id = uuid.uuid4()

    config_dict = server_config.model_dump()
    config_dict.update({"id": server_id, "container_id": ""})
    server_config_data = ServerConfig.model_validate(config_dict)

    out_db = Server(id=server_id, name=server_config.name)
    out_db.server_config_data = server_config_data

    try:
        config = await server_controller.add_serverV2(out_db)

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

    model.name = "test"

    db.commit()
    db.refresh(model)
    return ServerOut.model_validate(model)


@server_router.delete("/{server_id}")
async def delete_server(
    server_id: UUID4, db: DbSessionDep, server_controller: ServerControllerDep
) -> None:
    model = find_server_by_id(server_id, db)

    result = server_controller.remove_server(model.server_config_data)
    if not result:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Failed to delete server",
        )

    db.delete(model)
    db.commit()


@server_router.post("/{server_id}/start")
async def start_server(
    server_id: UUID4,
    db: DbSessionDep,
    server_controller: ServerControllerDep,
) -> None:
    model = find_server_by_id(server_id, db)

    result, err = server_controller.start(model)
    if not result:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "%s" % err)


@server_router.post("/{server_id}/stop")
async def stop_server(
    server_id: UUID4, db: DbSessionDep, server_controller: ServerControllerDep
) -> None:
    model = find_server_by_id(server_id, db)
    result = server_controller.stop(model)

    if not result:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR)
