

#!/bin/bash
cd "$(dirname "$0")/.."

npm run build

rm -rf ./hubs-client/dist
cp -r ./dist ./hubs-client/dist
