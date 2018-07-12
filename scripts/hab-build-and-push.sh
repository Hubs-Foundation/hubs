#!/bin/bash

export BASE_ASSETS_PATH=$1
export ASSET_BUNDLE_SERVER=$2
export TARGET_S3_PATH=$3

# To build + push to S3 run:
# hab studio run "bash scripts/hab-build-and-push.sh"

# On exit, need to make all files writable so CI can clean on next build
trap 'chmod -R a+rw .' EXIT

echo "Started build in $(pwd)"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

pushd "$DIR/.."
echo "Building in $(pwd)"

ls

mkdir -p .yarn
mkdir -p node_modules
mkdir -p build

# Yarn expects /usr/local/share
# https://github.com/yarnpkg/yarn/issues/4628
mkdir -p /usr/local/share

rm /usr/bin/env
ln -s "$(hab pkg path core/coreutils)/bin/env" /usr/bin/env
hab pkg install -b core/coreutils core/bash core/node core/yarn core/aws-cli core/git

yarn install --cache-folder .yarn
ls node_modules
ls node_modules/.bin
GENERATE_SMOKE_TESTS=true yarn build --output-path build
mkdir build/pages
mv build/*.html build/pages

aws s3 sync --acl public-read --cache-control "max-age=31556926" build/assets "$TARGET_S3_PATH/assets"
aws s3 sync --acl public-read --cache-control "no-cache" --delete build/pages "$TARGET_S3_PATH/pages"

rm -rf build
