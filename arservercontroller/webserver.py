from typing import Any, Optional
from fastapi import FastAPI
from pydantic import BaseModel

app: FastAPI = FastAPI()


class Item(BaseModel):
    name: str
    price: float
    is_offer: Optional[bool] = None


@app.get("/")
async def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
async def read_item(item_id: int, q: Optional[str] = None) -> dict[str, Any]:
    return {"item_id": item_id, "q": q}


@app.put("/items/{item_id}")
def update_item(item_id: int, item: Item) -> dict[str, Any]:
    return {"item_name": item.name, "item_id": item_id}


def run_server(host: str = "127.0.0.1", port: int = 8000) -> None:
    """Run the FastAPI application.

    Args:
        host: Host address to bind the server to
        port: Port number to listen on
    """
    import uvicorn

    uvicorn.run(app=app, host=host, port=port)
