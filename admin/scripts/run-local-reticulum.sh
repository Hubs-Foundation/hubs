#!/usr/bin/env bash
# Usage: run-local-reticulum.sh [IP address] to start hubs with a local reticulum instance

HOST=$1

if [ -e $HOST ]; then
  HOST="hubs.local"
  export RETICULUM_SOCKET_SERVER="hubs.local"
else
  export RETICULUM_SOCKET_SERVER="$1"
fi

CORS_PROXY_SERVER="hubs-proxy.local:4000" NON_CORS_PROXY_DOMAINS="$HOST,dev.reticulum.io" BASE_ASSETS_PATH="https://$HOST:8989/" RETICULUM_SERVER="$HOST:4000" POSTGREST_SERVER="" ITA_SERVER="" npm start
