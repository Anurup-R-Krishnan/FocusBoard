#!/bin/sh
set -e

mkdir -p /app/.cache
chown -R app:app /app/.cache

exec su -s /bin/sh app -c "$*"
