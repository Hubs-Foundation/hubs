pkg_name=hubs
pkg_origin=mozillareality
pkg_maintainer="Mozilla Mixed Reality <mixreality@mozilla.com>"

pkg_version="1.0.0"
pkg_license=('MPLv2')
pkg_description="Duck-powered web-based social VR."
pkg_upstream_url="https://hubs.mozilla.com/"
pkg_build_deps=(
    core/coreutils
    core/bash
    core/node10
    core/git
)

pkg_deps=(
    core/aws-cli # AWS cli used for run hook when uploading to S3
)

do_build() {
  ln -s "$(hab pkg path core/coreutils)/bin/env" /usr/bin/env
  npm ci --verbose --no-progress
  npm rebuild node-sass # HACK sometimes node-sass build fails
  npm rebuild node-sass # HACK sometimes node-sass build fails
  npm rebuild node-sass # HACK sometimes node-sass build fails

  # We inject random tokens into the build that will be replaced at run webhook/deploy time with the actual runtime configs.
  export DEFAULT_SCENE_SID="$(echo "default_scene_sid" | sha256sum | cut -d' ' -f1)/"
  export BASE_ASSETS_PATH="$(echo "base_assets_path" | sha256sum | cut -d' ' -f1)/" # HACK need a trailing slash so webpack'ed semantics line up
  export RETICULUM_SERVER=$(echo "reticulum_server" | sha256sum | cut -d' ' -f1) 
  export THUMBNAIL_SERVER=$(echo "thumbnail_server" | sha256sum | cut -d' ' -f1) 
  export CORS_PROXY_SERVER=$(echo "cors_proxy_server" | sha256sum | cut -d' ' -f1) 
  export NON_CORS_PROXY_DOMAINS=$(echo "non_cors_proxy_domains" | sha256sum | cut -d' ' -f1) 
  export POSTGREST_SERVER=$(echo "postgrest_server" | sha256sum | cut -d' ' -f1) 
  export SENTRY_DSN=$(echo "sentry_dsn" | sha256sum | cut -d' ' -f1) 
  export GA_TRACKING_ID=$(echo "ga_tracking_id" | sha256sum | cut -d' ' -f1) 
  export BUILD_VERSION="${pkg_version}.$(echo $pkg_prefix | cut -d '/' -f 7)"

  npm run build

  mkdir -p dist/pages
  mv dist/*.html dist/pages
  mv dist/hub.service.js dist/pages
  mv dist/manifest.webmanifest dist/pages
}

do_install() {
  cp -R dist "${pkg_prefix}"
}
