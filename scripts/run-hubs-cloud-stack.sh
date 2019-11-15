#!/usr/bin/env bash
# Usage: run-local-reticulum.sh [IP address] to start hubs with a local reticulum instance

STACK_NAME=$1
EXTERNAL_ZONE_NAME=$2
INTERNAL_ZONE_NAME=$3
LOCAL_HOST=$3

if [[ -z "$STACK_NAME" || -z "$EXTERNAL_ZONE_NAME" || -z "$INTERNAL_ZONE_NAME" ]] ; then 
  echo -e "Runs your local repo against a remote Hubs Cloud instance.

Usage: scripts/run-hubs-cloud-stack.sh <stack-name> <domain> <internal-domain> [local-host]

For example if your stack is "myhubs" at "myhubs.com" and your internal domain is "myhubs-internal.com" run:

scripts/run-hubs-cloud-stack.sh myhubs myhubs.com myhubs-internal.com

If you would like to use the hubs.local hostname instead of localhost for your local web server
(for example, if you are using a VM and need to use an IP other than 127.0.0.1) specify 'hubs.local'
for the local-host option."
  exit 1
fi

if [ -e $HOST ]; then
  HOST="localhost"
fi

CORS_PROXY_SERVER="$STACK_NAME-cors-proxy.$INTERNAL_ZONE_NAME" NON_CORS_PROXY_DOMAINS="$HOST,$EXTERNAL_ZONE_NAME" BASE_ASSETS_PATH="/" RETICULUM_SERVER="$EXTERNAL_ZONE_NAME" POSTGREST_SERVER="" ITA_SERVER="" npm start
