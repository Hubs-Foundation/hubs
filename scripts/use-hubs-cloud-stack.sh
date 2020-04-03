#!/usr/bin/env bash

STACK_NAME=$1
EXTERNAL_ZONE_NAME=$2
SHORTLINK_ZONE_NAME=$3
INTERNAL_ZONE_NAME=$4
CORS_PROXY_SERVER=$5

if [[ -z "$STACK_NAME" || -z "$EXTERNAL_ZONE_NAME" || -z "$SHORTLINK_ZONE_NAME" || -z "$INTERNAL_ZONE_NAME" ]] ; then 
  echo -e "Usage: scripts/use-hubs-cloud-stack.sh <stack-name> <domain> <short-link-domain> <internal-domain> [cors-proxy-worker]

Switches your local client to connect to a remote Hubs Cloud instance by modifying .env.defaults.

For example if your stack is "myhubs" at "myhubs.com", your short link domain is "myhub.link",
and your internal domain is "myhubs-internal.com", run:

scripts/use-hubs-cloud-stack.sh myhubs myhubs.com myhub.link myhubs-internal.com

And then subsequent runs to "npm start" and the client at https://localhost:8080 will use your Hubs Cloud stack.

If you will be accessing webpack dev server via an IP other than localhost, you should
add a host entry for "hubs.local" in your /etc/hosts file that points to the IP you will be using. Then,
load "https://hubs.local:8080" after running "npm start".

Once you've run this script, your local stack will use your Hubs cloud instance, not the Mozilla dev servers.
To switch back to the Mozilla dev servers, run scripts/use-mozilla-dev.sh"
  exit 1
fi

if [ -e $HOST ]; then
  HOST="hubs.local"
fi

if [ -e $CORS_PROXY_SERVER ]; then
  CORS_PROXY_SERVER="$STACK_NAME-cors-proxy.$INTERNAL_ZONE_NAME"
fi

cat > .env.defaults << EOF
USE_FEATURE_CONFIG=true
USE_HUBS_CLOUD_APP_CONFIG=true

SHORTLINK_DOMAIN="$SHORTLINK_ZONE_NAME"

RETICULUM_SERVER="$EXTERNAL_ZONE_NAME"

# CORS proxy.
CORS_PROXY_SERVER="$CORS_PROXY_SERVER"

# The thumbnailing backend to connect to.
# See here for the server code: https://github.com/MozillaReality/farspark or https://github.com/MozillaReality/nearspark
THUMBNAIL_SERVER="$STACK_NAME-nearspark.$INTERNAL_ZONE_NAME"

# The root URL under which Hubs expects environment GLTF bundles to be served.
ASSET_BUNDLE_SERVER="https://asset-bundles-prod.reticulum.io"

# Comma-separated list of domains which are known to not need CORS proxying
NON_CORS_PROXY_DOMAINS="$HOST,$EXTERNAL_ZONE_NAME,$STACK_NAME-assets.$INTERNAL_ZONE_NAME"

# The root URL under which Hubs expects static assets to be served.
BASE_ASSETS_PATH=/

POSTGREST_SERVER=""
ITA_SERVER=""
EOF

