#!/bin/bash

set -eux

ARGS_STRING=""
if [ -f "$ARGS_FILE" ]; then
    ARGS_STRING=$(cat "$ARGS_FILE")
fi

if [ -f "${REFORGER_MOCK}" ]; then
    exec $REFORGER "$ARGS_STRING"
else
    bash -c "$REFORGER" "$ARGS_STRING"
fi