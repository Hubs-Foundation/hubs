
#cheatsheet
#if [ -z ${var1+x} ]; then echo "is unset"; else echo " is set to '$var1'"; fi
if [ -z ${turkeyCfg_thumbnail_server+x} ]; then export turkeyCfg_thumbnail_server="nearspark.reticulum.io"; fi
if [ -z ${turkeyCfg_base_assets_path+x} ]; then export turkeyCfg_base_assets_path="https://$SUB_DOMAIN-assets.$DOMAIN/hubs/"; fi
if [ -z ${turkeyCfg_non_cors_proxy_domains+x} ]; then export turkeyCfg_non_cors_proxy_domains="$SUB_DOMAIN.$DOMAIN,$SUB_DOMAIN-assets.$DOMAIN"; fi
if [ -z ${turkeyCfg_reticulum_server+x} ]; then export turkeyCfg_reticulum_server="$SUB_DOMAIN.$DOMAIN"; fi
if [ -z ${turkeyCfg_cors_proxy_server+x} ]; then export turkeyCfg_cors_proxy_server="$SUB_DOMAIN-cors.$DOMAIN"; fi
if [ -z ${turkeyCfg_shortlink_domain+x} ]; then export turkeyCfg_shortlink_domain="$SUB_DOMAIN.$DOMAIN"; fi
if [ "$turkeyCfg_reticulum_server" = "$turkeyCfg_shortlink_domain" ]; then turkeyCfg_shortlink_domain="${turkeyCfg_shortlink_domain}/link"; fi
if [ -z ${turkeyCfg_sentry_dsn+x} ]; then export turkeyCfg_sentry_dsn=""; fi
if [ -z ${turkeyCfg_postgrest_server+x} ]; then export turkeyCfg_postgrest_server=""; fi
# if [ -z ${turkeyCfg_ita_server+x} ]; then export turkeyCfg_ita_server=""; fi
if [ -z ${turkeyCfg_ga_tracking_id+x} ]; then export turkeyCfg_ga_tracking_id=""; fi
export turkeyCfg_ita_server="turkey"

find /www/hubs/ -type f -name *.html -exec sed -i "s/{{rawhubs-base-assets-path}}\//${turkeyCfg_base_assets_path//\//\\\/}/g" {} \;           
find /www/hubs/ -type f -name *.html -exec sed -i "s/{{rawhubs-base-assets-path}}/${turkeyCfg_base_assets_path//\//\\\/}/g" {} \; 
find /www/hubs/ -type f -name *.css -exec sed -i "s/{{rawhubs-base-assets-path}}\//${turkeyCfg_base_assets_path//\//\\\/}/g" {} \; 
find /www/hubs/ -type f -name *.css -exec sed -i "s/{{rawhubs-base-assets-path}}/${turkeyCfg_base_assets_path//\//\\\/}/g" {} \;             
anchor="<!-- DO NOT REMOVE\/EDIT THIS COMMENT - META_TAGS -->" 
for f in /www/hubs/pages/*.html; do 
    for var in $(printenv); do 
    var=$(echo $var | cut -d"=" -f1 ); prefix="turkeyCfg_"; 
    [[ $var == $prefix* ]] && sed -i "s/$anchor/ <meta name=\"env:${var#$prefix}\" content=\"${!var//\//\\\/}\"\/> $anchor/" $f; 
    done 
done 

if [ "${access_log}" = "enabled" ]; then sed -i "s/access_log off;//g" /etc/nginx/conf.d/default.conf; fi

nginx -g "daemon off;"
