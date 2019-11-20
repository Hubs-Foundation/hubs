#!/usr/bin/env bash

cat > .env.defaults << EOF
RETICULUM_SERVER="dev.reticulum.io"

# CORS proxy.
CORS_PROXY_SERVER="cors-proxy-dev.reticulum.io"

# The thumbnailing backend to connect to.
# See here for the server code: https://github.com/MozillaReality/farspark or https://github.com/MozillaReality/nearspark
THUMBNAIL_SERVER="nearspark-dev.reticulum.io"

# The root URL under which Hubs expects environment GLTF bundles to be served.
ASSET_BUNDLE_SERVER="https://asset-bundles-prod.reticulum.io"

# Comma-separated list of domains which are known to not need CORS proxying
NON_CORS_PROXY_DOMAINS="hubs.local,dev.reticulum.io"

# The root URL under which Hubs expects static assets to be served.
BASE_ASSETS_PATH=/
EOF
