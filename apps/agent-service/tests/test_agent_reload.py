from unittest.mock import Mock

from sidecar.agent import AgentService


def test_reload_starts_without_stopping_missing_process(tmp_path, mocker):
    service = AgentService()
    config_path = tmp_path / "config.json"
    start_server = mocker.patch.object(
        service, "start_server", return_value={"pid": 123, "status": "started"}
    )
    stop_server = mocker.patch.object(service, "stop_server")

    result = service.reload_config(["-config"], str(config_path), {"name": "new"})

    assert result == {"pid": 123, "status": "started"}
    assert config_path.read_text(encoding="utf-8") == '{\n    "name": "new"\n}'
    stop_server.assert_not_called()
    start_server.assert_called_once_with(["-config"])


def test_reload_stops_running_process_before_starting(tmp_path, mocker):
    service = AgentService()
    service.server_proc = Mock()
    service.server_proc.poll.return_value = None
    start_server = mocker.patch.object(
        service, "start_server", return_value={"pid": 456, "status": "started"}
    )
    stop_server = mocker.patch.object(service, "stop_server")

    result = service.reload_config(
        ["-config"], str(tmp_path / "config.json"), {"name": "new"}
    )

    assert result == {"pid": 456, "status": "started"}
    stop_server.assert_called_once_with()
    start_server.assert_called_once_with(["-config"])
