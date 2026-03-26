# arservercontroller

Arma Reforger Dedicated Server container manager.

# TODO's

## `api/v1/servers.py`

[TODO] terminar os endpoints (start, stop e etc.).\
[DONE] terminar de fazer o Dockerfile e scripts do servidor.

## `services/controller.py`

[TODO] terminar a integração de env vars de apoio (ln 54..ln 62).\
[DONE] terminar a integração do `add_server` e `start_server` e etc. com a API.\
[DONE] adicionar labels aos containers em `add_server`.\
[DONE] separar o controller em `ServerContainerController` para manejar servidores dentro de containers e `ServerController` para controlar servidores diretamente.

[TODO] add `async` na API pública (`start_server`, `remove_server` e `update_server`)\
[TODO] futuramente, deixar variável o modo de network do container (host ou bridge)

## `services/server.py`

~~[TODO] fazer um `ServerService` para cuidar de erros e operações no banco de dados e delegar lógica para o controller.~~\
[TODO] futuramente, usar `ServerService` para criar servidores diretamente como processos ao inves de usar containers

## `services/server_config.py`

[TODO] terminar a integração com os endpoints da API.\
[TODO] ter certeza de que a config gerenciada pelo `ServerConfigManager` é sincronizada com a database.

## `tests/`

[TODO] terminar e refazer integration tests dos services primeiro.\
[TODO] por fim fazer os unit tests dos endpoints da API.

## `tasks.py`

[TODO] sincronizar HOST e PORT com as settings do app.\
[TODO] abrir o app pelo uvicorn passando HOST e PORT.\
[TODO] talvez usar make

## `data/controller/ds_configs/base.json`

[DONE] gerar esse arquivo de config automáticamente quando o app for aberto.\
[TODO] testar a conexão usando `bindAddress` com o IP da `bridge` network.

## `backend/alembic`

~~[TODO] add script para dar upgrade automático da database quando o app for aberto.~~

## misc

[DONE] resolver o problema do `fastapi` chamar funções do `ServerController` mais de uma vez por request.