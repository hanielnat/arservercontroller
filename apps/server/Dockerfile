FROM python:3.14-slim AS base
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

WORKDIR /app

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-dev --no-install-project

COPY alembic ./alembic
COPY README.md alembic.ini .python-version pyproject.toml uv.lock ./
COPY arservercontroller ./arservercontroller

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV HOST=0.0.0.0\
    PORT=8000 \
    UV_NO_DEV=1 \
    UV_NO_SYNC=1

EXPOSE $PORT

RUN mkdir -p /app/data/db /app/data/logs /app/data/controller/profiles

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

ENTRYPOINT [ "sh", "-c", "uv run alembic upgrade head && exec uv run uvicorn arservercontroller.main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8000}" ]
