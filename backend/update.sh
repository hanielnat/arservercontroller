#!/bin/bash

set -eux

exec $STEAMCMD +force_install_dir /reforger \
    +login anonymous \
    +app_update $REFORGER_APPID validate \
    +quit