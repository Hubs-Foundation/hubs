#!/usr/bin/env sh

script_directory=$(dirname "$0")
script_directory=$(realpath "$script_directory")

echo 'Installing Hubs dependencies'
cd $script_directory/../..
yarn 
echo 'Building Hubs'
yarn build > /dev/null

cd $script_directory
echo 'Installing bot dependencies'
yarn 
echo 'Running Hubs'
yarn serve --ssl --port 8080 ../../public &
echo 'Running bots'
if [ "$1" != "" ]; then
  node run-bot.js --room $1
else
  node run-bot.js
fi

trap 'kill $(jobs -pr)' SIGINT SIGTERM EXIT
