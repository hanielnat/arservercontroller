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
    UV_PYTHON_DOWNLOADS=manual

WORKDIR /agent

COPY agent-service/uv.lock agent-service/pyproject.toml ./
COPY agent-service/ ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv python install 3.14 \
    && uv sync --locked --no-dev

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

COPY --from=agent-builder /agent /agent

COPY --from=agent-builder /root/.local/share/uv/python /root/.local/share/uv/python

ENV REFORGER_DIR="/reforger" \
    REFORGER="/reforger/ArmaReforgerServer" \
    AGENT_PORT=8080 \
    PATH="/agent/.venv/bin:$PATH"

WORKDIR /agent

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${AGENT_PORT}/health || exit 1

ENTRYPOINT ["sh", "-c", "exec sidecar --port ${AGENT_PORT:-8080}"]