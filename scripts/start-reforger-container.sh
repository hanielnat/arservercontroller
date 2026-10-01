#!/usr/bin/env bash

set -ux

TEST_SERVER_IMAGE_NAME="arserver-mock:latest"
TEST_SERVER_CONTAINER_NAME="reforger_testserver"
TEST_SERVER_BIND_PORT="2555"
TEST_SERVER_A2S_PORT="18989"
TEST_SERVER_RCON_PORT="18787"
TEST_SERVER_AGENT_PORT="8080"
TEST_SERVER_AGENT_DEBUG="1"


if docker ps -a | grep $TEST_SERVER_CONTAINER_NAME > /dev/null 2>&1 ; then
    docker rm -f $TEST_SERVER_CONTAINER_NAME
fi

# Uncomment if running under `host` network
# docker run -d --name "$TEST_SERVER_CONTAINER_NAME" --network host arserver:latest bash

# Uncomment if running under `bridge` network
docker run \
    -d \
    --name "$TEST_SERVER_CONTAINER_NAME" \
    -e AGENT_DEBUG="$TEST_SERVER_AGENT_DEBUG" \
    -p "$TEST_SERVER_BIND_PORT:$TEST_SERVER_BIND_PORT/udp" \
    -p "$TEST_SERVER_A2S_PORT:$TEST_SERVER_A2S_PORT/udp" \
    -p "$TEST_SERVER_RCON_PORT:$TEST_SERVER_RCON_PORT/udp" \
    -p "$TEST_SERVER_AGENT_PORT:$TEST_SERVER_AGENT_PORT/tcp" \
    "$TEST_SERVER_IMAGE_NAME" \
    bash

exit $?