# -------------------------------------------------------------------------------
# frontend
FROM oven/bun:debian AS client

WORKDIR /workspace
COPY package.json bun.lock ./
COPY apps/agent-service/package.json ./apps/agent-service/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN bun install --frozen-lockfile --ignore-scripts

COPY apps/web ./apps/web
RUN bun run --filter web build

# -------------------------------------------------------------------------------
# backend
FROM python:3.14-slim AS server
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/arservercontroller/.venv

WORKDIR /arservercontroller
COPY pyproject.toml uv.lock ./
COPY apps/server/pyproject.toml apps/server/README.md ./apps/server/
COPY apps/agent-service/pyproject.toml apps/agent-service/README.md ./apps/agent-service/

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev --package arservercontroller --no-install-project

COPY ./.python-version ./.python-version
COPY apps/server/alembic.ini ./apps/server/alembic.ini
COPY apps/server/alembic ./apps/server/alembic
COPY apps/server/arservercontroller ./apps/server/arservercontroller
COPY --from=client /workspace/apps/web/dist ./apps/web/dist

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev --package arservercontroller

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
