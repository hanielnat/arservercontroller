class ARServerConfigType:
    def __init__(
        self,
        server_name: str,
        profile_path: str,
        arserver_config_path: str,
        ports: dict[str, int],
        arserver_bin: str,
        arserver_bin_path: str,
        container_id: str | None,
    ):
        self.server_name = server_name
        self.profile_path = profile_path
        self.arserver_config_path = arserver_config_path
        self.ports = ports
        self.arserver_bin = arserver_bin
        self.arserver_bin_path = arserver_bin_path
        self.container_id = container_id


class ServerConfigType:
    def __init__(self, server_name: str, arserver_config: ARServerConfigType):
        self.server_name = server_name
        self.arserver_config = arserver_config
