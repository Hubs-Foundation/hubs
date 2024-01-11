#!/bin/sh
set -ex
cd "$(dirname "$0")"

. ./env.sh

cd ../admin

mkdir -p certs
cp $SSL_CERT_FILE ./certs/cert.pem
cp $SSL_KEY_FILE ./certs/key.pem

export HOST="$HUBS_HOST"
export RETICULUM_SOCKET_SERVER="$HUBS_HOST"
export CORS_PROXY_SERVER="$HUBS_HOST:4080"
export NON_CORS_PROXY_DOMAINS="$HUBS_HOST"
export BASE_ASSETS_PATH="https://$HUBS_HOST:8989/"
export RETICULUM_SERVER="$HUBS_HOST:4000"
export POSTGREST_SERVER=""
export ITA_SERVER=""
export INTERNAL_HOSTNAME="$HUBS_HOST"
export HOST_IP="0.0.0.0"

npm run dev
