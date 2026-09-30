# syntax=docker/dockerfile:1

FROM python:3.14-slim AS agent-builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=manual

WORKDIR /agent

COPY agent-service/uv.lock agent-service/pyproject.toml ./
COPY agent-service/ ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev

FROM python:3.14-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=agent-builder /agent /agent

ENV AGENT_PORT=8080 \
    PATH="/agent/.venv/bin:$PATH"

WORKDIR /agent

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${AGENT_PORT}/health || exit 1

ENTRYPOINT ["sh", "-c", "exec sidecar --port ${AGENT_PORT:-8080}"]