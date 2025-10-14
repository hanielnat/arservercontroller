#!/usr/bin/env bash

set -ux

TESTSERVER_CONTAINER_NAME="reforger_testserver"
TESTSERVER_BIND_PORT="2555"
TESTSERVER_A2S_PORT="18989"
TESTSERVER_RCON_PORT="18787"


if docker ps -a | grep $TESTSERVER_CONTAINER_NAME > /dev/null 2>&1 ; then
    docker rm -f $TESTSERVER_CONTAINER_NAME
fi

# Uncomment if running under `host` network
# docker run -d --name $TESTSERVER_CONTAINER_NAME --network host arserver:latest bash

# Uncomment if running under `bridge` network
docker run \
    -d \
    --name $TESTSERVER_CONTAINER_NAME \
    -p "$TESTSERVER_BIND_PORT:$TESTSERVER_BIND_PORT/udp" \
    -p "$TESTSERVER_A2S_PORT:$TESTSERVER_A2S_PORT/udp" \
    arserver:latest \
    bash

exit $?