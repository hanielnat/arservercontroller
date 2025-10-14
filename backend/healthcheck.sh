#!/bin/bash

if ! nc -zvu 127.0.0.1 2555 > /dev/null 2>&1; then
    exit 1
fi

exit 0
