import appLogo from "../assets/images/app-logo.png";
import appLogoDark from "../assets/images/app-logo-dark.png";
import companyLogo from "../assets/images/company-logo.png";
import homeHeroBackground from "../assets/images/home-hero-background-unbranded.png";
import sceneEditorLogo from "../assets/images/editor-logo.png";
import { getLocale, getMessage } from "./i18n";

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
  "BASE_ASSETS_PATH",
  "UPLOADS_HOST"
].forEach(x => {
  const el = document.querySelector(`meta[name='env:${x.toLowerCase()}']`);
  configs[x] = el ? el.getAttribute("content") : process.env[x];

  const BASE_ASSETS_PATH_KEY = "BASE_ASSETS_PATH";
  if (x === BASE_ASSETS_PATH_KEY && configs[BASE_ASSETS_PATH_KEY]) {
    // BASE_ASSETS_PATH might be a relative URL like "/" when it is set in
    // .env or .defaults.env when running locally. We need to convert that
    // to an absolute URL.
    if (!configs[BASE_ASSETS_PATH_KEY].startsWith("http")) {
      configs[BASE_ASSETS_PATH_KEY] = new URL(configs[BASE_ASSETS_PATH_KEY], window.location).toString();
    }

    // eslint-disable-next-line no-undef
    __webpack_public_path__ = configs[BASE_ASSETS_PATH_KEY];
  }
});

// Custom clients do not use <meta> tags for passing data, so if thumbnail_server meta tag exists, it is not a custom client
const hasThumbnailServerMetaTag = !!document.querySelector("meta[name='env:thumbnail_server']");
configs.IS_LOCAL_OR_CUSTOM_CLIENT = !hasThumbnailServerMetaTag;

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
      if (!Object.prototype.hasOwnProperty.call(theme, key)) continue;
      colorVars.push(`--${key}: ${theme[key]};`);
    }
    const style = document.createElement("style");
    style.innerHTML = `:root{${colorVars.join("\n")}}`;
    document.head.insertBefore(style, document.head.firstChild);
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
    logo_dark: appLogoDark,
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

configs.integration = integration => {
  const availableIntegrations = configs.AVAILABLE_INTEGRATIONS;
  // AVAILABLE_INTEGRATIONS has no properties defined on the dev server, but does support all integrations.
  return (
    !Object.prototype.hasOwnProperty.call(availableIntegrations, integration) || availableIntegrations[integration]
  );
};

configs.translation = key => {
  const locale = getLocale();
  const translationsConfig = (configs.APP_CONFIG && configs.APP_CONFIG.translations) || {};

  return (
    (translationsConfig[locale] && translationsConfig[locale][key]) ||
    (translationsConfig.en && translationsConfig.en[key]) ||
    getMessage(key) ||
    ""
  );
};

export default configs;
