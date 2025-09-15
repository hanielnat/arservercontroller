import datetime
import uuid

from arservercontroller.api.dependencies import DbSessionDep
from arservercontroller.db.models.server import Server
from arservercontroller.schemas.server import (
    ServerCreate,
    ServerOut,
    ServersOut,
    ServerUpdate,
)
from arservercontroller.schemas.server_config import ServerConfig
from fastapi import APIRouter, HTTPException
from pydantic import UUID4

server_router = APIRouter(prefix="/servers", tags=["server"])

# TODO: utilizar ServerConfig como schema de endpoint
# TODO: melhorar o update_server
# TODO: depois disso passar a config vinda do schema pro ServerController
# TODO: talvez usar SQLModel


@server_router.get("/")
async def get_servers(db: DbSessionDep, offset: int = 0, limit: int = 10) -> ServersOut:
    servers = db.query(Server).offset(offset).limit(limit).all()
    servers_out = [ServerOut.model_validate(server) for server in servers]
    return ServersOut(data=servers_out, count=len(servers_out))


@server_router.post("/")
async def add_server(server_config: ServerCreate, db: DbSessionDep) -> ServerOut:
    server_id = uuid.uuid4()
    server_config_data = None
    now = int(datetime.datetime.now().timestamp())

    if server_config.server_config_data:
        config_data = server_config.server_config_data.model_dump()
        config_data.update({"id": server_id, "container_id": server_id})
        server_config_data = ServerConfig.model_validate(config_data)

    out_db = Server(
        id=server_id, name=server_config.name, created_at=now, updated_at=now
    )
    out_db.server_config_data = (
        server_config_data  # Serializa/deserializa a string JSON automaticamente
    )

    db.add(out_db)
    db.commit()
    db.refresh(out_db)

    return ServerOut.model_validate(out_db)


@server_router.put("/{server_id}")
async def update_server(
    server_id: UUID4, new_server: ServerUpdate, db: DbSessionDep
) -> ServerOut:
    model = db.get(Server, server_id)
    if not model:
        raise HTTPException(
            status_code=404, detail=f"Server not found. 'server_id': {server_id}"
        )

    update_data = new_server.model_dump(exclude_unset=True)
    update_data.update({"id": server_id, "container_id": model})

    model.name = "test"

    # for field, value in update_data.items():
    #     if field == "server_config_data":
    #         # Se for um dicionário, converter para ServerConfig
    #         if isinstance(value, dict):
    #             setattr(model, "server_config_data", ServerConfig.model_validate(value))
    #         else:
    #             setattr(model, "server_config_data", value)
    #     elif hasattr(model, field):
    #         setattr(model, field, value)

    # if hasattr(model, "updated_at"):
    #     setattr(model, "updated_at", int(datetime.datetime.now().timestamp()))

    db.commit()
    db.refresh(model)

    return ServerOut.model_validate(model)


@server_router.delete("/{server_id}")
async def delete_server(server_id: UUID4, db: DbSessionDep) -> None:
    model = db.get(Server, server_id)
    if not model:
        raise HTTPException(
            status_code=404, detail=f"Server not found. 'server_id': {server_id}"
        )
    db.delete(model)
    db.commit()
