// Read configs from global variable if available, otherwise use the process.env injected from build.
const configs = {};

[
  "RETICULUM_SERVER",
  "THUMBNAIL_SERVER",
  "CORS_PROXY_SERVER",
  "NON_CORS_PROXY_DOMAINS",
  "SENTRY_DSN",
  "GA_TRACKING_ID",
  "BASE_ASSETS_PATH"
].forEach(x => {
  const el = document.querySelector(`meta[name='env:${x.toLowerCase()}']`);
  configs[x] = el ? el.getAttribute("content") : process.env[x];

  if (x === "BASE_ASSETS_PATH" && configs[x]) {
    // eslint-disable-next-line no-undef
    __webpack_public_path__ = configs[x];
  }
});

// Also include APP_CONFIG that reticulum injects as a script in the page head.
if (window.APP_CONFIG) {
  configs.APP_CONFIG = window.APP_CONFIG;
  const { colors } = configs.APP_CONFIG;
  if (colors) {
    const colorVars = [];
    for (const key in colors) {
      if (!colors.hasOwnProperty(key)) continue;
      colorVars.push(`--${key}: ${colors[key]};`);
    }
    const style = document.createElement("style");
    style.innerHTML = `:root{${colorVars.join("\n")}}`;
    document.head.prepend(style);
  }
}

configs.feature = featureName => {
  return configs.APP_CONFIG && configs.APP_CONFIG.features && configs.APP_CONFIG.features[featureName];
};

configs.image = (imageName, defaultImage, cssUrl) => {
  const url = (configs.APP_CONFIG && configs.APP_CONFIG.images && configs.APP_CONFIG.images[imageName]) || defaultImage;
  return url && cssUrl ? `url(${url})` : url;
};

export default configs;
