#!/bin/bash
set -e

echo "=== MOCK ArmaReforgerServer STARTED ==="
echo "PID: $$"
echo "Args passed: $*"

printf "\n\n"

if [ -f "${ARGS_FILE:-/data/controller/args.txt}" ]; then
    echo "Loaded ARGS_FILE content:"
    cat "${ARGS_FILE:-/data/controller/args.txt}"
fi

printf "\n\n"

if [ -f "$HOME/config.json" ]; then
    CONFIG_NAME=$(grep -o '"name": *"[^"]*"' "$HOME/config.json" | cut -d'"' -f4 || echo "unknown")
    echo "Mock loaded game name from config: $CONFIG_NAME"
fi

printf "\n\n"

echo "Starting fake UDP listener on port 2555..."
( socat UDP4-LISTEN:2555,reuseaddr,fork EXEC:"echo mock_udp_response" > /dev/null 2>&1 & )

printf "\n\n"

echo "Mock RCON/A2S ports ready. Keeping container alive for CRUD testing..."
exec sleep infinity