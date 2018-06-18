#!/usr/bin/env bash

if [ ! -e ../reticulum ]; then
  echo "This script assumes reticulum is checked out in a sibling to this folder."
fi

rm -rf ../reticulum/priv/static ; GENERATE_SMOKE_TESTS=true BASE_ASSETS_PATH=https://hubs.local:4000/ yarn build -- --output-path ../reticulum/priv/static 
