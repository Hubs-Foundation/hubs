// Read configs from global variable if available, otherwise use the process.env injected from build.
const configs = {};

["RETICULUM_SERVER", "POSTGREST_SERVER", "ITA_SERVER", "CONFIGURABLE_SERVICES"].forEach(x => {
  configs[x] = window.env && typeof window.env[x] !== "undefined" ? window.env[x] : process.env[x];
});

export default configs;
