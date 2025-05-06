###
# this dockerfile produces image/container that serves customly packaged hubs and admin static files
# the result container should serve reticulum as "hubs_page_origin" and "admin_page_origin" on (path) "/hubs/pages"
###
from node:16.16 as builder
env QT_QPA_PLATFORM offscreen
run apt update && apt -y install phantomjs
run mkdir -p /hubs/admin/ && cd /hubs
copy package.json ./
copy package-lock.json ./
run npm ci
copy admin/package.json admin/
copy admin/package-lock.json admin/
run cd admin && npm ci --legacy-peer-deps && cd ..
copy . .
env BASE_ASSETS_PATH="{{rawhubs-base-assets-path}}"
run npm run build 1> /dev/null
run cd admin && npm run build 1> /dev/null && cp -R dist/* ../dist && cd ..
run mkdir -p dist/pages && mv dist/*.html dist/pages && mv dist/hub.service.js dist/pages && mv dist/schema.toml dist/pages          
run mkdir /hubs/rawhubs && mv dist/pages /hubs/rawhubs && mv dist/assets /hubs/rawhubs && mv dist/favicon.ico /hubs/rawhubs/pages

from alpine/openssl as ssl
run mkdir /ssl && openssl req -x509 -newkey rsa:2048 -sha256 -days 36500 -nodes -keyout /ssl/key -out /ssl/cert -subj '/CN=hubs'

from nginx:alpine
run apk add bash
run mkdir /ssl && mkdir -p /www/hubs && mkdir -p /www/hubs/pages && mkdir -p /www/hubs/assets
copy --from=ssl /ssl /ssl
copy --from=builder /hubs/rawhubs/pages /www/hubs/pages
copy --from=builder /hubs/rawhubs/assets /www/hubs/assets
copy scripts/docker/nginx.config /etc/nginx/conf.d/default.conf
copy scripts/docker/run.sh /run.sh
run chmod +x /run.sh && cat /run.sh
cmd bash /run.sh
