#!/usr/bin/env bash

cd apps/server
docker buildx build -t arserver:latest -f reforger.Dockerfile .