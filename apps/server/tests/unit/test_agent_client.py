from arservercontroller.services.agent_client import AgentClient


def test_agent_client_uses_configured_container_name_template(mocker):
    config = mocker.Mock(
        AGENT_URL_TEMPLATE="http://127.0.0.1",
        AGENT_HOST_TEMPLATE="{container_name}.kiri.localhost",
    )
    mocker.patch(
        "arservercontroller.services.agent_client.get_config", return_value=config
    )

    agent = AgentClient("172.18.0.2", "test-server")

    assert agent.base_url == "http://127.0.0.1"
    assert agent.client.headers["Host"] == "test-server.kiri.localhost"


def test_agent_client_defaults_to_container_ip(mocker):
    config = mocker.Mock(
        AGENT_URL_TEMPLATE="http://{container_ip}:8080",
        AGENT_HOST_TEMPLATE="",
    )
    mocker.patch(
        "arservercontroller.services.agent_client.get_config", return_value=config
    )

    agent = AgentClient("172.18.0.2", "test-server")

    assert agent.base_url == "http://172.18.0.2:8080"
    assert "Host" not in agent.client.headers
