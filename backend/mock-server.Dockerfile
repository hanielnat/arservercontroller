# syntax=docker/dockerfile:1
FROM alpine:3.23

ARG SERVER_NAME=test-server

RUN apk add --no-cache bash socat netcat-openbsd

RUN mkdir -p /reforger \
    && mkdir -p /home/${SERVER_NAME}
COPY mock-server.sh /reforger/ArmaReforgerServer
COPY entrypoint.sh update.sh healthcheck.sh /data/controller/
RUN chmod +x /data/controller/*.sh && \
    chmod +x /reforger/ArmaReforgerServer

ENV REFORGER_DIR="/reforger" \
    REFORGER="${REFORGER_DIR}/ArmaReforgerServer" \
    REFORGER_MOCK=1 \
    ARGS_FILE="/data/controller/args.txt"

WORKDIR ${REFORGER_DIR}

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "/data/controller/healthcheck.sh" ]

ENTRYPOINT [ "/data/controller/entrypoint.sh" ]