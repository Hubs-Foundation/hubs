#!/usr/bin/env sh

script_directory=$(dirname "$0")
script_directory=$(realpath "$script_directory")
cd $script_directory/..

# yarn build
# yarn serve --ssl --port 8080
yarn
yarn start &
node scripts/run-bot.js
