#!/bin/bash

export DEFAULT_SCENE_SID=$1
export BASE_ASSETS_PATH=$2
export RETICULUM_SERVER=$3
export THUMBNAIL_SERVER=$4
export CORS_PROXY_SERVER=$5
export NON_CORS_PROXY_DOMAINS=$6
export TARGET_S3_BUCKET=$7
export SENTRY_DSN=$8
export GA_TRACKING_ID=${9}
export BUILD_NUMBER=${10}
export GIT_COMMIT=${11}
export HAB_ORG=${12}
export HAB_RING=${13}
export HAB_HOST=${14}
export BUILD_VERSION="${BUILD_NUMBER} (${GIT_COMMIT})"

# Build the package, upload it, and start the service so we deploy to staging target.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$DIR/../habitat/plan.sh"
PKG="$pkg_origin/$pkg_name"

pushd "$DIR/.."

trap "chmod -R a+rw . && rm /hab/svc/$pkg_name/var/deploying" EXIT

# Wait for a lock file so we serialize deploys
mkdir -p /hab/svc/$pkg_name/var
while [ -f /hab/svc/$pkg_name/var/deploying ]; do sleep 1; done
touch /hab/svc/$pkg_name/var/deploying

rm -rf results
mkdir -p results
hab pkg build .
hab svc unload $PKG
/usr/bin/hab-pkg-install results/*.hart
hab svc load $PKG
hab svc stop $PKG

cat > build-config.toml << EOTOML
[general]
default_scene_sid = "$DEFAULT_SCENES_SID"
base_assets_path = "$BASE_ASSETS_PATH"
reticulum_server = "$RETICULUM_SERVER"
thumbnail_server = "$THUMBNAIL_SERVER"
cors_proxy_server = "$CORS_PROXY_SERVER"
non_cors_proxy_domains = "$NON_CORS_PROXY_DOMAINS"
sentry_dsn = "$SENTRY_DSN"
ga_tracking_id = "$GA_TRACKING_ID"

[deploy]
type = "s3"
target = "$TARGET_S3_BUCKET"
region = "us-west-1"
EOTOML

cat build-config.toml | hab config apply -r $HAB_HOST "$pkg_name.default@$HAB_ORG" $(date +%s)
cat build-config.toml
rm build-config.toml
hab svc start $PKG

# Add a short buffer to help ensure s3 sync completes before slack message
sleep 5
