#!/usr/bin/env bash

uv export --locked --package sidecar --no-dev --no-emit-project --no-hashes --format requirements-txt --output-file apps/agent-service/requirements.lock
docker buildx build -t arserver-mock:latest -f apps/server/reforger-mock.Dockerfile .