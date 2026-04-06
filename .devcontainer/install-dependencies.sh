#!/usr/bin/env bash

set -e

sudo apt-get update -y && sudo apt-get upgrade -y

sudo usermod -aG docker "$USER"

if docker run --rm hello-world | grep -q "Hello from Docker!"; then
    echo "Docker is installed and working correctly."
else
    echo "Docker installation failed or is not working correctly."
fi

chmod +x backend/tasks.sh
echo "Creating Python virtual environment..."
backend/tasks.sh venv

echo "Installing Python packages into the virtual environment..."
backend/tasks.sh

echo "Installing pnpm packages..."
bun install --cwd frontend/
echo "Dependency installation and venv creation complete."
