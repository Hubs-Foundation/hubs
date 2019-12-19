// Read configs from global variable if available, otherwise use the process.env injected from build.
const configs = {};

["RETICULUM_SERVER", "POSTGREST_SERVER", "ITA_SERVER", "CONFIGURABLE_SERVICES", "CORS_PROXY_SERVER"].forEach(x => {
  const el = document.querySelector(`meta[name='env:${x.toLowerCase()}']`);
  configs[x] = el ? el.getAttribute("content") : process.env[x];
});

export default configs;
