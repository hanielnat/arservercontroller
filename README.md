# arservercontroller

Arma Reforger Dedicated Server container manager.

# TODO's

## `api/v1/users.py`

[TODO] criar token jwt em `login_user`.\
[TODO] configurar middleware `OAuth2PasswordBearer`.

## `services/controller.py`

[TODO] terminar a integração de env vars de apoio (ln 54..ln 62).\
[TODO] terminar a integração do `add_server` e `start_server` e etc. com a API.

## `services/server_config.py`

[TODO] terminar a integração com os endpoints da API.\
[TODO] ter certeza de que a config gerenciada pelo `ServerConfigManager` é sincronizada com a database.

## `tests/`

[TODO] terminar e refazer integration tests dos services primeiro.\
[TODO] por fim fazer os unit tests dos endpoints da API.