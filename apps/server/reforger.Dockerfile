# syntax=docker/dockerfile:1

# -------------------------------------------------------------------------------
# stage 1 - agent
FROM debian:bookworm-slim AS agent-builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=manual \
    UV_PROJECT_ENVIRONMENT=/arservercontroller/.venv

WORKDIR /arservercontroller

COPY apps/agent-service/requirements.lock ./apps/agent-service/requirements.lock
COPY apps/agent-service/pyproject.toml apps/agent-service/README.md ./apps/agent-service/
COPY apps/agent-service/src ./apps/agent-service/src

RUN --mount=type=cache,target=/root/.cache/uv \
    uv python install 3.14 \
    && uv venv --python 3.14 /arservercontroller/.venv \
    && uv pip install --python /arservercontroller/.venv/bin/python -r apps/agent-service/requirements.lock \
    && uv pip install --python /arservercontroller/.venv/bin/python --no-deps --editable apps/agent-service

# -------------------------------------------------------------------------------
# stage 2 - steamcmd and reforger server download
FROM debian:bookworm-slim AS reforger

RUN dpkg --add-architecture i386 \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    libcurl4 \
    libssl3 \
    lib32gcc-s1 \
    curl \
    wget \
    net-tools \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir /steamcmd \
    && cd /steamcmd \
    && wget -q https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz \
    && tar -xzf steamcmd_linux.tar.gz \
    && rm steamcmd_linux.tar.gz

ENV STEAMCMD=/steamcmd/steamcmd.sh \
    REFORGER_APPID=1874900

RUN --mount=type=cache,target=/root/Steam \
    --mount=type=cache,target=/steamcmd/steamapps \
    ${STEAMCMD} \
    +force_install_dir /reforger \
    +login anonymous \
    +app_update ${REFORGER_APPID} validate \
    +quit \
    && chmod +x /reforger/ArmaReforgerServer

# -------------------------------------------------------------------------------
# stage 3 - final
FROM debian:bookworm-slim

RUN dpkg --add-architecture i386 \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    libcurl4 \
    libssl3 \
    lib32gcc-s1 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=reforger /reforger /reforger

COPY --from=agent-builder /arservercontroller/.venv /arservercontroller/.venv
COPY --from=agent-builder /arservercontroller/apps/agent-service/src /arservercontroller/apps/agent-service/src

COPY --from=agent-builder /root/.local/share/uv/python /root/.local/share/uv/python

ENV REFORGER_DIR="/reforger" \
    REFORGER="/reforger/ArmaReforgerServer" \
    AGENT_PORT=8080 \
    PATH="/arservercontroller/.venv/bin:$PATH"

WORKDIR /arservercontroller

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${AGENT_PORT}/health || exit 1

ENTRYPOINT ["sh", "-c", "exec sidecar --port ${AGENT_PORT:-8080}"]