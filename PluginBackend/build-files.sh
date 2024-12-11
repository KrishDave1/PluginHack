#!/bin/bash
set -e

# Install dependencies
python3.10 -m ensurepip --upgrade
python3.10 -m pip install --upgrade pip setuptools wheel
apt-get update && apt-get install -y python3-distutils

# Install project requirements
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run database migrations
python manage.py migrate
