// Read configs from global variable if available, otherwise use the process.env injected from build.
const configs = {};

[
  "CONFIGURABLE_SERVICES",
  "CORS_PROXY_SERVER",
  "DISABLE_BRANDING",
  "ITA_SERVER",
  "POSTGREST_SERVER",
  "RETICULUM_SERVER",
  "TIER"
].forEach(x => {
  const el = document.querySelector(`meta[name='env:${x.toLowerCase()}']`);
  configs[x] = el ? el.getAttribute("content") : process.env[x];
});

// Custom clients do not use <meta> tags for passing data, so if reticulum_server meta tag exists, it is not a custom client
const hasReticulumServerMetaTag = !!document.querySelector("meta[name='env:reticulum_server']");
configs.IS_LOCAL_OR_CUSTOM_CLIENT = !hasReticulumServerMetaTag;

export default configs;
