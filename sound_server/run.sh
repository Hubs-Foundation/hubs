# Usage: JWT_SECRET="s3cr3t-do-not-l34k" ./run.sh [MIXES_DIR="mixes"]

mixes=${1:-"mixes"}

docker run --rm -it \
           -e JWT_SECRET=${JWT_SECRET} \
           -v `pwd`/nginx.conf:/nginx.conf \
           -v `pwd`/bearer.lua:/bearer.lua \
           -v "$(pwd)/${mixes}":/www \
           -p 80:80 \
           ubergarm/openresty-nginx-jwt
