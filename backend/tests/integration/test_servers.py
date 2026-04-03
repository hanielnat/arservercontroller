import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest
from arservercontroller.services.creation_manager import ServerCreationManager
from arservercontroller.utils.errors import Ok
from fastapi import status
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_create_server_async(client: TestClient) -> None:
    payload = {
        "name": "test-server-simple",
        "bind_port": 20002,
        "bind_address": "0.0.0.0",
        "a2s_port": 17779,
        "rcon_port": 19997,
    }
    response = client.post("/api/v1/servers", json=payload)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
async def test_create_server_and_websocket_logs(client: TestClient, mocker) -> None:
    # Mock docker_manager.create_server_container to avoid real docker calls
    mock_container = MagicMock()
    mock_container.id = "fake_container_id_123456789"
    mock_container.status = "created"

    async def side_effect(image_name, config, on_progress):
        await on_progress(
            {"phase": "docker", "step": "prepare", "message": "preparing"}
        )
        await on_progress({"phase": "docker", "step": "create", "message": "creating"})
        await on_progress({"phase": "docker", "step": "created", "message": "created"})
        return Ok(mock_container)

    mocker.patch(
        "arservercontroller.services.docker.DockerContainerManager.create_server_container",
        side_effect=side_effect,
    )

    payload = {
        "name": "test-server-ws",
        "bind_port": 20001,
        "bind_address": "0.0.0.0",
        "a2s_port": 17778,
        "rcon_port": 19998,
    }

    # 1. Create server
    response = client.post("/api/v1/servers", json=payload)
    assert response.status_code == status.HTTP_200_OK
    server_data = response.json()
    server_id = server_data["id"]

    # 2. Connect to websocket and collect logs
    with client.websocket_connect(
        f"/api/v1/servers/ws/{server_id}/creation"
    ) as websocket:
        logs = []
        # We expect a series of logs until the final one
        while True:
            data = websocket.receive_json()
            logs.append(data)
            if data.get("final") == "true":
                break

        # 3. Assert logs are as expected
        # Expected steps in order: start -> prepare -> create -> created -> success
        steps = [log["step"] for log in logs]
        assert "start" in steps
        assert "prepare" in steps
        assert "create" in steps
        assert "created" in steps
        assert "success" in steps

        # Check some content
        start_log = next(log for log in logs if log["step"] == "start")
        assert "test-server-ws" in start_log["message"]

        success_log = next(log for log in logs if log["step"] == "success")
        assert success_log["final"] == "true"


@pytest.mark.asyncio
async def test_create_server_and_cancel_creation(client: TestClient, mocker) -> None:
    mock_container = MagicMock()
    mock_container.id = "fake_container_id_cancel"
    mock_container.status = "created"

    creation_started_event = asyncio.Event()
    cancel_event = asyncio.Event()

    async def side_effect(image_name, config, on_progress):
        await on_progress(
            {"phase": "docker", "step": "prepare", "message": "preparing"}
        )
        creation_started_event.set()
        try:
            await asyncio.wait_for(cancel_event.wait(), timeout=5.0)
        except asyncio.TimeoutError:
            pass
        await on_progress({"phase": "docker", "step": "create", "message": "creating"})
        await on_progress({"phase": "docker", "step": "created", "message": "created"})
        return Ok(mock_container)

    mocker.patch(
        "arservercontroller.services.docker.DockerContainerManager.create_server_container",
        side_effect=side_effect,
    )

    payload = {
        "name": "test-server-cancel",
        "bind_port": 20003,
        "bind_address": "0.0.0.0",
        "a2s_port": 17780,
        "rcon_port": 19999,
    }

    response = client.post("/api/v1/servers", json=payload)
    assert response.status_code == status.HTTP_200_OK
    server_data = response.json()
    server_id = server_data["id"]

    with client.websocket_connect(
        f"/api/v1/servers/ws/{server_id}/creation"
    ) as websocket:
        await creation_started_event.wait()

        cancel_event.set()

        logs = []
        while True:
            data = websocket.receive_json()
            logs.append(data)
            if data.get("final") == "true":
                break

        steps = [log["step"] for log in logs]
        assert "start" in steps
        assert "prepare" in steps
        assert "cancel" in steps

        cancel_log = next(log for log in logs if log["step"] == "cancel")
        assert cancel_log["final"] == "true"
        assert "cancelled" in cancel_log["message"].lower()
