import appLogo from "../assets/images/app-logo.png";
import companyLogo from "../assets/images/company-logo.png";
import homeHeroBackground from "../assets/images/home-hero-background-unbranded.png";
import sceneEditorLogo from "../assets/images/editor-logo.png";

// Read configs from global variable if available, otherwise use the process.env injected from build.
const configs = {};
let isAdmin = false;

[
  "RETICULUM_SERVER",
  "THUMBNAIL_SERVER",
  "CORS_PROXY_SERVER",
  "NON_CORS_PROXY_DOMAINS",
  "SENTRY_DSN",
  "GA_TRACKING_ID",
  "SHORTLINK_DOMAIN",
  "BASE_ASSETS_PATH"
].forEach(x => {
  const el = document.querySelector(`meta[name='env:${x.toLowerCase()}']`);
  configs[x] = el ? el.getAttribute("content") : process.env[x];

  if (x === "BASE_ASSETS_PATH" && configs[x]) {
    // eslint-disable-next-line no-undef
    __webpack_public_path__ = configs[x];
  }
});

// Also include configs that reticulum injects as a script in the page head.

configs.AVAILABLE_INTEGRATIONS = window.AVAILABLE_INTEGRATIONS || {};

if (process.env.APP_CONFIG) {
  window.APP_CONFIG = process.env.APP_CONFIG;
}

if (window.APP_CONFIG) {
  configs.APP_CONFIG = window.APP_CONFIG;
  const { theme } = configs.APP_CONFIG;
  if (theme) {
    const colorVars = [];
    for (const key in theme) {
      if (!theme.hasOwnProperty(key)) continue;
      colorVars.push(`--${key}: ${theme[key]};`);
    }
    const style = document.createElement("style");
    style.innerHTML = `:root{${colorVars.join("\n")}}`;
    document.head.prepend(style);
  }

  if (!configs.APP_CONFIG.features) {
    configs.APP_CONFIG.features = {};
  }
} else {
  configs.APP_CONFIG = {
    features: {}
  };
}

const isLocalDevelopment = process.env.NODE_ENV === "development";

configs.feature = featureName => {
  const value = configs.APP_CONFIG && configs.APP_CONFIG.features && configs.APP_CONFIG.features[featureName];
  if (typeof value === "boolean" || featureName === "enable_spoke") {
    const forceEnableSpoke = featureName === "enable_spoke" && isAdmin;
    return forceEnableSpoke || value;
  } else {
    return value;
  }
};

let localDevImages = {};
if (isLocalDevelopment) {
  localDevImages = {
    logo: appLogo,
    company_logo: companyLogo,
    editor_logo: sceneEditorLogo,
    home_background: homeHeroBackground
  };
}

configs.image = (imageName, cssUrl) => {
  const url =
    (configs.APP_CONFIG && configs.APP_CONFIG.images && configs.APP_CONFIG.images[imageName]) ||
    localDevImages[imageName];
  return url && cssUrl ? `url(${url})` : url;
};

configs.link = (linkName, defaultValue) => {
  return (configs.APP_CONFIG && configs.APP_CONFIG.links && configs.APP_CONFIG.links[linkName]) || defaultValue;
};

configs.setIsAdmin = _isAdmin => {
  isAdmin = _isAdmin;
};
configs.isAdmin = () => isAdmin;

configs.hasPlugins = hook => {
  return configs.APP_CONFIG && configs.APP_CONFIG.plugins && configs.APP_CONFIG.plugins[hook];
};

configs.registeredPlugins = {};

configs.registerPlugin = (hook, exports) => {
  if (!configs.registeredPlugins[hook]) {
    configs.registeredPlugins[hook] = {};
  }
  Object.assign(configs.registeredPlugins[hook] || {}, exports);
};

configs.loadPlugins = async hook => {
  const plugins = configs.APP_CONFIG && configs.APP_CONFIG.plugins && configs.APP_CONFIG.plugins[hook];
  const pluginManifests = configs.APP_CONFIG && configs.APP_CONFIG.pluginManifests;

  if (!plugins && !pluginManifests) {
    return {};
  }

  const scripts = [];

  if (plugins) {
    for (const file of plugins) {
      // TODO: In the future we can dynamically load dependencies here.
      if (file.type === "js") {
        scripts.push(import(/* webpackIgnore: true */ new URL(file.url, window.location)));
      }
    }
  }

  if (pluginManifests) {
    for (const manifestUrl of pluginManifests) {
      const absoluteManifestUrl = new URL(manifestUrl, window.location).href;
      const response = await fetch(absoluteManifestUrl);
      const pluginManifest = await response.json();
      const files = pluginManifest.hooks[hook];

      if (files) {
        for (const file of files) {
          if (file.type === "js") {
            scripts.push(import(/* webpackIgnore: true */ new URL(file.url, absoluteManifestUrl).href));
          }
        }
      }
    }
  }

  await Promise.all(scripts);

  return configs.registeredPlugins[hook] || {};
};

export default configs;
