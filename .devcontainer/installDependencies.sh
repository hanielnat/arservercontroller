#!/bin/bash

set -e

sudo apt-get update -y && sudo apt-get upgrade -y

sudo usermod -aG docker $USER

if docker run --rm hello-world | grep -q "Hello from Docker!"; then
    echo "Docker is installed and working correctly."
else
    echo "Docker installation failed or is not working correctly."
fi

echo "Creating Python virtual environment..."
pipx install uv && uv venv -c backend/.venv

echo "Installing Python packages into the virtual environment..."
uv --directory backend sync
echo "Dependency installation and venv creation complete."
