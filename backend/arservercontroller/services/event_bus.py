from collections.abc import Awaitable, Callable
from threading import RLock
from typing import Annotated, Any

from fastapi import Depends

from arservercontroller.services.logger import get_logger

type Event = str
type EventData = dict[str, Any] | None
type Handler = Callable[[EventData], None]
type AsyncHandler = Callable[[EventData], Awaitable[None]]
type EventMapping = dict[str, list[AsyncHandler]]

logger = get_logger(__name__)


class ServerEventBus:
    """Simple async event bus. Subscribers receive events by name."""

    def __init__(self) -> None:
        self._subscribers: EventMapping = {}
        self._lock: RLock = RLock()

    def subscribe(self, event_name: str, handler: AsyncHandler) -> None:
        """Subscribe a handler to an event."""
        with self._lock:
            if event_name not in self._subscribers:
                self._subscribers[event_name] = []

            self._subscribers[event_name].append(handler)

    async def emit(self, event_name: str, data: EventData = None) -> None:
        """Emit an event to all subscribers."""
        with self._lock:
            handlers = self._subscribers.get(event_name, [])[:]

        for handler in handlers:
            try:
                await handler(data)
            except Exception:
                pass


event_bus: ServerEventBus = ServerEventBus()


def get_event_bus() -> ServerEventBus:
    return event_bus


ServerEventBusDep = Annotated[ServerEventBus, Depends(get_event_bus)]


async def _main() -> None:
    async def test_handler(data: EventData) -> None:
        print(data)

    event_bus = get_event_bus()
    event_bus.subscribe("on_test", test_handler)

    async def test_emitter() -> None:
        await event_bus.emit("on_test", {"test": "emitter"})
        await event_bus.emit("on_test", {"test": ["emitter", "2"]})
        await event_bus.emit("on_test", {"test": ["emitter", 3]})

    import asyncio

    async def test_emitter_threaded() -> None:
        coro = await asyncio.to_thread(test_emitter)
        await coro

    for _ in range(10):
        await test_emitter_threaded()


if __name__ == "__main__":
    import asyncio

    asyncio.run(_main())
