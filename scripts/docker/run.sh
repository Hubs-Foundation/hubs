
export turkeyCfg_postgrest_server=""
export turkeyCfg_thumbnail_server="nearspark.reticulum.io"
export turkeyCfg_base_assets_path="https://$SUB_DOMAIN-assets.$DOMAIN/hubs/"
export turkeyCfg_non_cors_proxy_domains="$SUB_DOMAIN.$DOMAIN,$SUB_DOMAIN-assets.$DOMAIN"
export turkeyCfg_reticulum_server="$SUB_DOMAIN.$DOMAIN"
export turkeyCfg_cors_proxy_server="$SUB_DOMAIN-cors.$DOMAIN"
export turkeyCfg_ga_tracking_id=""
export turkeyCfg_shortlink_domain="$SUB_DOMAIN.$DOMAIN"
export turkeyCfg_ita_server=""
export turkeyCfg_sentry_dsn=""

find /www/hubs/ -type f -name *.html -exec sed -i "s/{{rawhubs-base-assets-path}}\//https:\/\/${SUB_DOMAIN}-assets.${DOMAIN}\/hubs\//g" {} \;           
find /www/hubs/ -type f -name *.html -exec sed -i "s/{{rawhubs-base-assets-path}}/https:\/\/${SUB_DOMAIN}-assets.${DOMAIN}\/hubs\//g" {} \; 
find /www/hubs/ -type f -name *.css -exec sed -i "s/{{rawhubs-base-assets-path}}\//https:\/\/${SUB_DOMAIN}-assets.${DOMAIN}\/hubs\//g" {} \; 
find /www/hubs/ -type f -name *.css -exec sed -i "s/{{rawhubs-base-assets-path}}/https:\/\/${SUB_DOMAIN}-assets.${DOMAIN}\/hubs\//g" {} \;             
anchor="<!-- DO NOT REMOVE\/EDIT THIS COMMENT - META_TAGS -->" 
for f in /www/hubs/pages/*.html; do 
    for var in $(printenv); do 
    var=$(echo $var | cut -d"=" -f1 ); prefix="turkeyCfg_"; 
    [[ $var == $prefix* ]] && sed -i "s/$anchor/ <meta name=\"env:${var#$prefix}\" content=\"${!var//\//\\\/}\"\/> $anchor/" $f; 
    done 
done 
nginx -g "daemon off;"
