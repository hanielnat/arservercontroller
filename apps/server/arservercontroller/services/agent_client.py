from collections.abc import AsyncIterator
from http import HTTPStatus
from typing import Any

import httpx

from arservercontroller.services.logger import get_logger

logger = get_logger(__name__)


class AgentClient:
    """HTTP client to communicate with the agent sidecar inside the container."""

    def __init__(self, container_ip: str, port: int = 8080):
        self.base_url = f"http://{container_ip}:{port}"
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self) -> None:
        await self.client.aclose()

    async def is_ready(self) -> bool:
        response = await self.client.get(f"{self.base_url}/health")
        return response.status_code == HTTPStatus.OK

    async def start_server(self, launch_options: list[str]) -> dict[str, Any]:
        """Calls /start endpoint to launch game server using pre-mounted config."""
        url = f"{self.base_url}/start"

        logger.debug("Calling agent /start at %s with options: %s", url, launch_options)
        response = await self.client.post(url, json=launch_options)
        response.raise_for_status()
        return response.json()

    async def stop_server(self) -> dict[str, Any]:
        """Calls /stop endpoint to cleanly stop the game process."""
        url = f"{self.base_url}/stop"
        logger.info("Calling agent /stop at %s", url)
        response = await self.client.post(url)
        response.raise_for_status()
        return response.json()

    async def reload_config(
        self, launch_options: list[str], config_path: str, config: dict[str, Any]
    ) -> dict[str, Any]:
        """Calls /stop and /start endpoint to write new config and restart the game process."""
        url = f"{self.base_url}/reload"

        payload = {
            "launch_options": launch_options,
            "config_path": config_path,
            "config": config,
        }

        import json

        logger.debug(
            f"Calling agent /reload at {url} with payload: {json.dumps(payload)}"
        )

        response = await self.client.post(url, json=payload)

        response.raise_for_status()
        return response.json()

    async def get_status(self) -> dict[str, Any]:
        """Calls /status endpoint to get process state and PID."""
        url = f"{self.base_url}/status"
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json()

    async def stream_logs(self, limit: int, follow: bool) -> AsyncIterator[str]:
        """Calls /logs/stream endpoint to get logs from a running reforger server process via SSE."""
        url = f"{self.base_url}/logs/stream"

        logger.debug(
            f"Calling agent /logs/stream at {url} with params: limit={limit} follow={follow}"
        )

        params = {"limit": limit, "follow": str(follow).lower()}
        async with self.client.stream("GET", url, params=params) as stream:
            event_type = "log"
            data_lines: list[str] = []

            async for raw in stream.aiter_lines():
                line = raw.rstrip("\r")

                # end of a SSE event
                if line == "":
                    if data_lines:
                        payload = "\n".join(data_lines)

                        if event_type == "log":
                            yield payload

                        data_lines.clear()
                        event_type = "log"

                    continue

                # comment / keep-alive
                if line.startswith(":"):
                    continue

                if line.startswith("event:"):
                    event_type = line[6:].strip()
                    continue

                if line.startswith("data:"):
                    data_lines.append(line[5:].lstrip())
                    continue

                # default case
                data_lines.append(line)
