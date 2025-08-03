from docker.models.containers import Container

from arservercontroller.constants import EnumARServerStatus
from arservercontroller.db.models.server_configs import ARServerConfigType


class ARServer:
    def __init__(
        self,
        server_name: str,
        server_config: ARServerConfigType,
        container: Container,
        status: EnumARServerStatus,
    ) -> None:
        self._server_name: str = server_name
        self._server_config: ARServerConfigType = server_config
        self._container: Container = container
        self._status: EnumARServerStatus = status
        if not self._server_name:
            raise ValueError("O nome do servidor não pode ser vazio.")

    def __str__(self) -> str:
        return f"ARServer(server_name={self.server_name}, status={self.update_container_status()}, config={self.server_config})"

    @property
    def server_name(self) -> str:
        """Nome do servidor."""
        return self._server_name

    @server_name.setter
    def server_name(self, value: str) -> None:
        """Define o nome do servidor."""
        if not value:
            raise ValueError("O nome do servidor não pode ser vazio.")
        self._server_name = value

    @property
    def server_config(self) -> ARServerConfigType:
        """Configuração do servidor AR."""
        return self._server_config

    @server_config.setter
    def server_config(self, value: ARServerConfigType) -> None:
        """Define a configuração do servidor AR."""
        self._server_config = value

    @property
    def container(self) -> Container:
        """Retorna o container Docker associado ao servidor."""
        return self._container

    @container.setter
    def container(self, value: Container) -> None:
        """Define o container Docker associado ao servidor."""
        self._container = value

    @property
    def status(self) -> EnumARServerStatus:
        """Retorna o status atual do servidor."""
        status = self.update_container_status()
        return status

    def update_container_status(self) -> EnumARServerStatus:
        """Atualiza o status do servidor com base no status do container."""
        self.container.reload()
        self._status = EnumARServerStatus[self.container.status.upper()]
        return self._status

    def reload_container_status(self) -> EnumARServerStatus:
        """Recarrega o status do container e atualiza o status do servidor."""
        self._container.reload()
        self.update_container_status()
        return self._status
