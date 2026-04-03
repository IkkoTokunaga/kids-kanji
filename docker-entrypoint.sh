#!/bin/sh
set -e
if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/node_modules /app/.next
  chown -R node:node /app/node_modules /app/.next
  if [ ! -d /app/node_modules/next ]; then
    runuser -u node -- npm install
  fi
  exec runuser -u node -- "$@"
fi
exec "$@"
