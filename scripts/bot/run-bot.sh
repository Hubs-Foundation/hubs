#!/usr/bin/env sh

script_directory=$(dirname "$0")
script_directory=$(realpath "$script_directory")

echo 'Installing Hubs dependencies'
cd $script_directory/../..
yarn 
echo 'Building Hubs'
yarn build > /dev/null
echo 'Running Hubs'
yarn serve --ssl --port 8080 public &

# install run-bot.js dependencies
cd $script_directory
echo 'Installing bot dependencies'
yarn 
echo 'Running bots'
node run-bot.js

trap 'kill $(jobs -pr)' SIGINT SIGTERM EXIT
