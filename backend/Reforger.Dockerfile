FROM debian:bullseye-slim AS builder

RUN dpkg --add-architecture i386 \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    libcurl4 \
    libssl1.1 \
    lib32gcc-s1 \
    curl \
    wget \
    netcat \
    iproute2 \
    net-tools \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir /steamcmd \
    && cd /steamcmd \
    && wget https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz \
    && tar -xvzf steamcmd_linux.tar.gz \
    && rm steamcmd_linux.tar.gz

ENV STEAMCMD="/steamcmd/steamcmd.sh"
WORKDIR /steamcmd

FROM builder

ENV REFORGER_APPID=1874900

RUN ${STEAMCMD} \
    +force_install_dir /reforger \
    +login anonymous \
    +app_update ${REFORGER_APPID} validate \
    +quit

COPY entrypoint.sh update.sh healthcheck.sh /data/controller/
RUN chmod +x /data/controller/update.sh \
    && chmod +x /data/controller/entrypoint.sh

ENV REFORGER_DIR="/reforger"
ENV REFORGER="${REFORGER_DIR}/ArmaReforgerServer"
ENV ARGS_FILE="/data/controller/args.txt"

WORKDIR ${REFORGER_DIR}
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "/data/controller/healthcheck.sh" ]
ENTRYPOINT [ "/data/controller/entrypoint.sh" ]
# CMD [ ]