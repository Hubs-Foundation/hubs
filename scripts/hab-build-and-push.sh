#!/bin/bash

export BASE_ASSETS_PATH=$1
export RETICULUM_SERVER=$2
export THUMBNAIL_SERVER=$3
export CORS_PROXY_SERVER=$4
export NON_CORS_PROXY_DOMAINS=$5
export TARGET_S3_BUCKET=$6
export SENTRY_DSN=$7
export GA_TRACKING_ID=$8
export BUILD_NUMBER=$9
export GIT_COMMIT=${10}
export BUILD_VERSION="${BUILD_NUMBER} (${GIT_COMMIT})"

# Build the package, upload it, and start the service so we deploy to staging target.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$DIR/../habitat/plan.sh"
PKG="$pkg_origin/$pkg_name"

pushd "$DIR/.."

trap "rm /hab/svc/$pkg_name/var/deploying && sudo /usr/bin/hab-clean-perms && chmod -R a+rw ." EXIT

# Wait for a lock file so we serialize deploys
mkdir -p /hab/svc/$pkg_name/var
while [ -f /hab/svc/$pkg_name/var/deploying ]; do sleep 1; done
touch /hab/svc/$pkg_name/var/deploying

rm -rf results
mkdir -p results
sudo /usr/bin/hab-docker-studio -k mozillareality run build
hab svc unload $PKG
sudo /usr/bin/hab-pkg-install results/*.hart
hab svc load $PKG
hab svc stop $PKG

# Apparently these vars come in from jenkins with quotes already
cat > build-config.toml << EOTOML
[general]
base_assets_path = $BASE_ASSETS_PATH
reticulum_server = $RETICULUM_SERVER
thumbnail_server = $THUMBNAIL_SERVER
cors_proxy_server = $CORS_PROXY_SERVER
non_cors_proxy_domains = $NON_CORS_PROXY_DOMAINS
sentry_dsn = $SENTRY_DSN
ga_tracking_id = $GA_TRACKING_ID

[deploy]
type = "s3"
target = $TARGET_S3_BUCKET
region = "us-west-1"
EOTOML

cat build-config.toml
sudo /usr/bin/hab-user-toml-install $pkg_name build-config.toml
hab svc start $PKG
sudo /usr/bin/hab-pkg-upload results/*.hart
sudo /usr/bin/hab-ret-pkg-upload results/*.hart
