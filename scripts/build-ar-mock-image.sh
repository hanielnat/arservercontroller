#!/usr/bin/env bash

cd apps/server
docker buildx build -t arserver-mock:latest -f reforger-mock.Dockerfile .