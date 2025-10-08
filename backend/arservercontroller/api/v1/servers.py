import datetime
import uuid

from arservercontroller.api.dependencies import DbSessionDep
from arservercontroller.db.models.server import Server
from arservercontroller.schemas.server import ServerOut, ServersOut
from arservercontroller.schemas.server_config import (
    ServerConfig,
    ServerConfigCreate,
    ServerConfigUpdate,
)
from fastapi import APIRouter, HTTPException
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
    server_config: ServerConfigCreate, db: DbSessionDep
) -> ServerConfig:
    server_id = uuid.uuid4()

    config_dict = server_config.model_dump()
    config_dict.update({"id": server_id, "container_id": str(server_id)})
    server_config_data = ServerConfig.model_validate(config_dict)

    now = int(datetime.datetime.now().timestamp())
    out_db = Server(
        id=server_id, name=server_config.name, created_at=now, updated_at=now
    )
    out_db.server_config_data = server_config_data

    db.add(out_db)
    db.commit()
    db.refresh(out_db)

    return ServerConfig.model_validate(out_db.server_config_data)


@server_router.put("/{server_id}")
async def update_server(
    server_id: UUID4, new_server: ServerConfigUpdate, db: DbSessionDep
) -> ServerOut:
    model = find_server_by_id(server_id, db)

    update_data = new_server.model_dump(exclude_unset=True)
    update_data.update({"id": server_id, "container_id": model})

    model.name = "test"

    db.commit()
    db.refresh(model)

    return ServerOut.model_validate(model)


@server_router.delete("/{server_id}")
async def delete_server(server_id: UUID4, db: DbSessionDep) -> None:
    model = find_server_by_id(server_id, db)
    db.delete(model)
    db.commit()
