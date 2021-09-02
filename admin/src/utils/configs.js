// Read configs from global variable if available, otherwise use the process.env injected from build.
const configs = {};

["RETICULUM_SERVER", "POSTGREST_SERVER", "ITA_SERVER", "CONFIGURABLE_SERVICES", "CORS_PROXY_SERVER"].forEach(x => {
  const el = document.querySelector(`meta[name='env:${x.toLowerCase()}']`);
  configs[x] = el ? el.getAttribute("content") : process.env[x];
});

configs.IS_LOCAL_OR_CUSTOM_CLIENT = document.querySelector("meta[name='env:reticulum_server']") ? false : true;

export default configs;
