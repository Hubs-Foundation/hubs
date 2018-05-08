#!/usr/bin/env sh

script_directory=$(dirname "$0")
script_directory=$(realpath "$script_directory")
cd $script_directory/..

yarn 

yarn build
yarn serve --ssl --port 8080 public &

node scripts/run-bot.js
