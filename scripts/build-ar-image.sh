#!/usr/bin/env bash

uv export --locked --package sidecar --no-dev --no-emit-project --no-hashes --format requirements-txt --output-file apps/agent-service/requirements.lock
docker buildx build -t arserver:latest -f apps/server/reforger.Dockerfile .