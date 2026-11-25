# syntax=docker/dockerfile:1

FROM python:3.14-slim AS agent-builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/arservercontroller/.venv

WORKDIR /arservercontroller

COPY apps/agent-service/requirements.lock ./apps/agent-service/requirements.lock
COPY apps/agent-service/pyproject.toml apps/agent-service/README.md ./apps/agent-service/
COPY apps/agent-service/src ./apps/agent-service/src

RUN --mount=type=cache,target=/root/.cache/uv \
    uv venv --python 3.14 /arservercontroller/.venv \
    && uv pip install --python /arservercontroller/.venv/bin/python -r apps/agent-service/requirements.lock \
    && uv pip install --python /arservercontroller/.venv/bin/python --no-deps --editable apps/agent-service

FROM python:3.14-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=agent-builder /arservercontroller/.venv /arservercontroller/.venv
COPY --from=agent-builder /arservercontroller/apps/agent-service/src /arservercontroller/apps/agent-service/src

ENV AGENT_PORT=8080 \
    UV_PYTHON_DOWNLOADS=never \
    REFORGER_DIR=/arservercontroller/apps/agent-service \
    PATH="/arservercontroller/.venv/bin:$PATH"

WORKDIR /arservercontroller

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${AGENT_PORT}/health || exit 1

ENTRYPOINT ["sh", "-c", "exec sidecar --port ${AGENT_PORT:-8080}"]