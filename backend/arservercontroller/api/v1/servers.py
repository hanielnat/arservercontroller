from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

server_router = APIRouter()


class Server(BaseModel):
    id: int
    name: str


class CreatedServer(BaseModel):
    name: str


class UpdateServerIn(CreatedServer): ...


fake_servers: list[Server] = [
    Server(id=1, name="test"),
    Server(id=2, name="test2"),
    Server(id=3, name="test3"),
    Server(id=4, name="test4"),
    Server(id=5, name="test5"),
]


@server_router.get("/servers/")
async def list_all(
    # controller: Annotated[ServerController ,Depends(ServerController)]
) -> list[Server]:
    return fake_servers


@server_router.post("/servers/add/")
async def add_server(server_name: str) -> CreatedServer:
    created = CreatedServer(name=server_name)
    fake_servers.append(Server(id=6, name=created.name))
    return created


@server_router.put("/servers/{server_id}/update")
async def update_server(server_id: int, new_server: UpdateServerIn):
    if server_id > len(fake_servers):
        raise HTTPException(
            status_code=404, detail=f"Item with id: {server_id}, not found."
        )
    fake_servers[server_id - 1].name = new_server.name


@server_router.delete("/servers/{server_id}/delete")
async def delete_server(server_id: int):
    if server_id > len(fake_servers):
        raise HTTPException(
            status_code=404, detail=f"Item with id: {server_id}, not found."
        )
    del fake_servers[server_id - 1]
