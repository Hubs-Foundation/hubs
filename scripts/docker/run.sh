
turkeyCfg_postgrest_server=""
turkeyCfg_thumbnail_server="nearspark.reticulum.io"
turkeyCfg_base_assets_path="https://$SUB_DOMAIN-assets.$DOMAIN/hubs/"
turkeyCfg_non_cors_proxy_domains="$SUB_DOMAIN.$DOMAIN,$SUB_DOMAIN-assets.$DOMAIN"
turkeyCfg_reticulum_server="$SUB_DOMAIN.$DOMAIN"
turkeyCfg_cors_proxy_server="$SUB_DOMAIN-cors.$DOMAIN"
turkeyCfg_ga_tracking_id=""
turkeyCfg_shortlink_domain="$SUB_DOMAIN.$DOMAIN"
turkeyCfg_ita_server=""
turkeyCfg_sentry_dsn=""

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
