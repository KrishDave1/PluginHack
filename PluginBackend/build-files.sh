#!/bin/bash
set -e

# Install dependencies
python3.9 -m ensurepip --upgrade
python3.9 -m pip install --upgrade pip setuptools wheel
apt-get update && apt-get install -y python3-distutils

# Install project requirements
pip install -r PluginBackend/requirements.txt

# Collect static files
python PluginBackend/manage.py collectstatic --noinput

# Run database migrations
python PluginBackend/manage.py migrate
