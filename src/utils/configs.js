// Read configs from global variable if available, otherwise use the process.env injected from build.
const configs = {};

[
  "DEFAULT_SCENE_SID",
  "RETICULUM_SERVER",
  "THUMBNAIL_SERVER",
  "CORS_PROXY_SERVER",
  "NON_CORS_PROXY_DOMAINS",
  "SENTRY_DSN",
  "GA_TRACKING_ID",
  "BUILD_VERSION"
].forEach(x => {
  const el = document.querySelector(`meta[name='env:${x.toLowerCase()}']`);
  configs[x] = el ? el.getAttribute("content") : process.env[x];
});

export default configs;
