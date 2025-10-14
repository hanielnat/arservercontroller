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
from fastapi import APIRouter, HTTPException, status
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
    db: DbSessionDep,
    server_controller: ServerControllerDep,
    # _: ModeratorOrAdminDep,
) -> ServerConfig:
    server_id = uuid.uuid4()

    config_dict = server_config.model_dump()
    config_dict.update({"id": server_id, "container_id": ""})
    server_config_data = ServerConfig.model_validate(config_dict)

    out_db = Server(id=server_id, name=server_config.name)
    out_db.server_config_data = server_config_data

    result, err = server_controller.add_server(out_db)
    if not result:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "%s" % err,
        )

    db.add(out_db)
    db.commit()
    db.refresh(out_db)

    return ServerConfig.model_validate(out_db.server_config_data)


@server_router.patch("/{server_id}")
async def update_server(
    server_id: UUID4,
    new_server: ServerConfigUpdate,
    db: DbSessionDep,
    _: ModeratorOrAdminDep,
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
    server_id: UUID4, db: DbSessionDep, _: ModeratorOrAdminDep
) -> None:
    model = find_server_by_id(server_id, db)
    db.delete(model)
    db.commit()


@server_router.post("/{server_id}")
async def start_server(
    server_id: UUID4,
    db: DbSessionDep,
    server_controller: ServerControllerDep,
    # _: ModeratorOrAdminDep
) -> None:
    model = find_server_by_id(server_id, db)

    result, err = server_controller.start(model)
    if not result:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "%s" % err)
