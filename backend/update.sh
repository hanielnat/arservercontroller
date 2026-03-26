#!/bin/bash

set -eux

if [ -f "${REFORGER_MOCK}" ]; then
    echo "update.sh called"
    exit 0
else
    exec $STEAMCMD +force_install_dir /reforger \
        +login anonymous \
        +app_update "$REFORGER_APPID" validate \
        +quit
fi