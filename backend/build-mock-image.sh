#!/usr/bin/env bash

docker buildx build -t arserver-mock:latest -f mock-server.Dockerfile .