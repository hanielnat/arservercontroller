# -------------------------------------------------------------------------------
# frontend
FROM oven/bun:debian AS client

WORKDIR /arservercontroller/apps/web
COPY apps/web ./
RUN bun install --frozen-lockfile && bun run build

# -------------------------------------------------------------------------------
# backend
FROM python:3.14-slim AS server
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

WORKDIR /arservercontroller/apps/server

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=apps/server/uv.lock,target=uv.lock \
    --mount=type=bind,source=apps/server/pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-dev --no-install-project

COPY apps/server/alembic ./alembic
COPY apps/server/README.md apps/server/alembic.ini apps/server/.python-version apps/server/pyproject.toml apps/server/uv.lock ./
COPY apps/server/arservercontroller ./arservercontroller
COPY --from=client /arservercontroller/apps/web/dist /arservercontroller/apps/web/dist

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV HOST=0.0.0.0 \
    PORT=8000 \
    UV_NO_DEV=1 \
    UV_NO_SYNC=1

EXPOSE $PORT

WORKDIR /arservercontroller/apps/server

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

ENTRYPOINT [ "sh", "-c", "uv run alembic upgrade head && exec uv run uvicorn arservercontroller.main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8000}" ]
