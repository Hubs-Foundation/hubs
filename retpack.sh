#!/bin/bash

if ! command -v docker &> /dev/null; then
    echo "ERR: this script requires docker (https://docs.docker.com/engine/install/)"
    exit 1
fi

DOCKER_DEFAULT_PLATFORM=linux/amd64
echo -e "\n ### building ### "
docker build -f RetPageOriginDockerfile -t hubs:retpack .

echo -e "\n ### packing ### "
docker run -v $PWD/.retpack/:/tmp/ \
    --entrypoint sh hubs:retpack \
    -c 'cd /www/hubs/ && tar -czvf /tmp/retpack.tar.gz .'

echo -e "\n ### done ### "
ls -lha ./.retpack/retpack.tar.gz
