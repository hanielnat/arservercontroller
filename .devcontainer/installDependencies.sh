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
python3 -m venv .venv

echo "Installing Python packages into the virtual environment..."
source .venv/bin/activate
.venv/bin/pip install --upgrade pip
.venv/bin/pip install --editable .
.venv/bin/pip install --editable .['dev']
deactivate

echo "Dependency installation and venv creation complete."
