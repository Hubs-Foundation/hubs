#!/usr/bin/env bash
HOST_IP=$1
if [ -z "$HOST_IP" ]; then
  echo "host ip required" >&2
  exit 1
fi
BASE_ASSETS_PATH="https://$HOST_IP:8080/" RETICULUM_SERVER="$HOST_IP:4000" HOST_IP="$HOST_IP" npm start
