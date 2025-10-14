#!/bin/bash

set -eux

ARGS_STRING=""
if [ -f $ARGS_FILE ]; then
    ARGS_STRING=$(cat "$ARGS_FILE")
fi

exec $REFORGER $ARGS_STRING