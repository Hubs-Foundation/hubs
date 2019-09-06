#!/bin/bash

export DEFAULT_SCENE_SID=$1
export BASE_ASSETS_PATH=$2
export RETICULUM_SERVER=$3
export THUMBNAIL_SERVER=$4
export CORS_PROXY_SERVER=$5
export NON_CORS_PROXY_DOMAINS=$6
export TARGET_S3_URL=$7
export SENTRY_DSN=$8
export GA_TRACKING_ID=${9}
export BUILD_NUMBER=${10}
export GIT_COMMIT=${11}
export BUILD_VERSION="${BUILD_NUMBER} (${GIT_COMMIT})"

# To build + push to S3 run:
# hab studio run "bash scripts/hab-build-and-push.sh"
# On exit, need to make all files writable so CI can clean on next build

trap 'chmod -R a+rw .' EXIT

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

pushd "$DIR/.."

rm /usr/bin/env
ln -s "$(hab pkg path core/coreutils)/bin/env" /usr/bin/env
hab pkg install -b core/coreutils core/bash core/node10 core/git core/aws-cli core/python2

npm ci --verbose --no-progress
npm rebuild node-sass # HACK sometimes node-sass build fails
npm rebuild node-sass # HACK sometimes node-sass build fails
npm rebuild node-sass # HACK sometimes node-sass build fails
npm run build
mkdir dist/pages
mv dist/*.html dist/pages
mv dist/hub.service.js dist/pages
mv dist/manifest.webmanifest dist/pages

# we need to upload wasm blobs with wasm content type explicitly because, unlike all our
# other assets, AWS's built-in MIME type dictionary doesn't know about that one
aws s3 sync --acl public-read --cache-control "max-age=31556926" --include "*" --exclude "*.wasm" dist/assets "$TARGET_S3_URL/hubs/assets"
aws s3 sync --acl public-read --cache-control "max-age=31556926" --exclude "*" --include "*.wasm" --content-type "application/wasm" dist/assets "$TARGET_S3_URL/hubs/assets"

aws s3 sync --acl public-read --cache-control "no-cache" --delete dist/pages "$TARGET_S3_URL/hubs/pages/latest"
aws s3 sync --acl public-read --cache-control "no-cache" --delete dist/pages "$TARGET_S3_URL/hubs/pages/releases/${BUILD_NUMBER}"
