# dr33m content server

Start with `JWT_SECRET=<secret_key> ./run.sh`

```bash
# run.sh
docker run --rm -it \
           -e JWT_SECRET=${JWT_SECRET} \
           -v `pwd`/nginx.conf:/nginx.conf \
           -v `pwd`/bearer.lua:/bearer.lua \
           -v `pwd`/mixes:/www \
           -p 80:80 \
           ubergarm/openresty-nginx-jwt
```

## File structure

- `/mixes`
  + `/lobby`
  + `/rooms` (all files beneath this are authed)
    * `/room1`
    * `/room2`
    * `/room3`
