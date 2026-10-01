#!/usr/bin/env bash

dir="$(realpath "$(dirname "$(dirname "$0")")")"
cd "$dir" || exit
docker buildx build -t arserver-mock:latest -f reforger-mock.Dockerfile .