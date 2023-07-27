import { waitForDOMContentLoaded } from "./async-utils";
import { store } from "./store-instance";

// NOTE these should be synchronized with the top of shared.scss
const DEFAULT_ACTION_COLOR = "#FF3464";
const DEFAULT_ACTION_COLOR_LIGHT = "#FF74A4";

const DEFAULT_COLORS = {
  "action-color": DEFAULT_ACTION_COLOR,
  "action-label-color": DEFAULT_ACTION_COLOR,
  "action-color-disabled": DEFAULT_ACTION_COLOR_LIGHT,
  "action-color-highlight": DEFAULT_ACTION_COLOR_LIGHT,
  "action-text-color": "#FFFFFF",
  "action-subtitle-color": "#F0F0F0",
  "notice-background-color": "#2F80ED",
  "notice-text-color": "#FFFFFF",
  "favorited-color": "#FFC000",
  "nametag-color": "#000000",
  "nametag-volume-color": "#7ED320",
  "nametag-text-color": "#FFFFFF",
  "nametag-border-color": "#7ED320",
  "nametag-border-color-raised-hand": "#FFCD74"
};

const config = (() => {
  let config = process.env.APP_CONFIG;

  // Storybook includes environment variables as a string
  // https://storybook.js.org/docs/react/configure/environment-variables
  if (!config && process.env.STORYBOOK_APP_CONFIG) {
    config = JSON.parse(process.env.STORYBOOK_APP_CONFIG);
  }

  if (!config) {
    config = window.APP_CONFIG;
  }

  if (config?.theme?.error) {
    console.error(
      `Custom themes failed to load.\n${config.theme.error}\nIf you are an admin, reconfigure your themes in the admin panel.`
    );
  }

  return config;
})();

const themes = config?.theme?.themes || [];

function getDarkModeQuery() {
  // window.matchMedia is not available when this module is imported in node.js,
  // which happens when using `npm run login` for Hubs Cloud customization.
  // So we return a dummy MediaQueryList instead.
  if (typeof window.matchMedia !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)");
  } else {
    return { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
  }
}

function registerDarkModeQuery(changeListener) {
  const darkModeQuery = getDarkModeQuery();

  // This is a workaround for old Safari.
  // Prior to Safari 14, MediaQueryList is based on EventTarget, so you must use
  // addListener() and removeListener() to observe media query lists.
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList/addListener
  // We may remove this workaround when no one will use Safari 13 or before.
  if (darkModeQuery.addEventListener) {
    darkModeQuery.addEventListener("change", changeListener);
  } else {
    darkModeQuery.addListener(changeListener);
  }

  const removeListener = () => {
    if (darkModeQuery.removeEventListener) {
      darkModeQuery.removeEventListener("change", changeListener);
    } else {
      darkModeQuery.removeListener(changeListener);
    }
  };

  return [darkModeQuery, removeListener];
}

function getDefaultTheme() {
  return themes.find(t => t.default) || themes[0];
}

function tryGetTheme(themeId) {
  if (!Array.isArray(themes)) return;

  const theme = themeId && themes.find(t => t.id === themeId);
  if (theme) {
    return theme;
  } else {
    const darkMode = getDarkModeQuery().matches;
    return (darkMode && themes.find(t => t.darkModeDefault)) || getDefaultTheme();
  }
}

function getCurrentTheme() {
  const preferredThemeId = store.state?.preferences?.theme;
  return tryGetTheme(preferredThemeId);
}

function getThemeColor(name) {
  const theme = getCurrentTheme();
  // config?.theme?.[name] ensures legacy variables for nametag colors are taken into account
  return theme?.variables?.[name] || config?.theme?.[name] || DEFAULT_COLORS[name];
}

function updateTextButtonColors() {
  const actionColor = getThemeColor("action-color");
  const actionHoverColor = getThemeColor("action-color-highlight");

  if (document.querySelector("#rounded-text-button")) {
    // NOTE, using the object-based {} setAttribute variant in a-frame
    // seems to not work in Firefox here -- the entities with the mixins are not
    // updated.
    document
      .querySelector("#rounded-text-button")
      .setAttribute(
        "text-button",
        `textHoverColor: ${actionHoverColor}; textColor: ${actionColor}; backgroundColor: #fff; backgroundHoverColor: #aaa;`
      );

    document
      .querySelector("#rounded-button")
      .setAttribute(
        "text-button",
        `textHoverColor: ${actionHoverColor}; textColor: ${actionColor}; backgroundColor: #fff; backgroundHoverColor: #aaa;`
      );

    document
      .querySelector("#rounded-text-action-button")
      .setAttribute(
        "text-button",
        `textHoverColor: #fff; textColor: #fff; backgroundColor: ${actionColor}; backgroundHoverColor: ${actionHoverColor}`
      );

    document
      .querySelector("#rounded-action-button")
      .setAttribute(
        "text-button",
        `textHoverColor: #fff; textColor: #fff; backgroundColor: ${actionColor}; backgroundHoverColor: ${actionHoverColor}`
      );
  }
}

function applyThemeToBody() {
  const theme = getCurrentTheme();
  document.body.setAttribute("data-theme", theme.name.toLowerCase().includes("dark") ? "dark" : "light");
}

function onThemeChanged(listener) {
  store.addEventListener("themechanged", listener);
  const [_darkModeQuery, removeDarkModeListener] = registerDarkModeQuery(listener);

  return () => {
    store.removeEventListener("themechanged", listener);
    removeDarkModeListener();
  };
}

waitForDOMContentLoaded().then(() => {
  if (process.env.NODE) {
    // We're running in node.js, which happens when "npm run login" is used, for example,
    // so don't bother doing anything UI related.
    return;
  }

  // Set initial theme
  const theme = getCurrentTheme();
  if (theme && theme.name.toLowerCase().includes("dark")) {
    document.body.setAttribute("data-theme", "dark");
  } else {
    document.body.setAttribute("data-theme", "light");
  }

  updateTextButtonColors();
  onThemeChanged(() => {
    updateTextButtonColors();
    applyThemeToBody();
  });
});

function applyThemeToTextButton(el, highlighted) {
  el.setAttribute(
    "text-button",
    "backgroundColor",
    highlighted ? getThemeColor("action-color-highlight") : getThemeColor("action-color")
  );
  el.setAttribute(
    "text-button",
    "backgroundHoverColor",
    highlighted ? "#aaa" : getThemeColor("action-color-highlight")
  );
}

export {
  applyThemeToTextButton,
  getCurrentTheme,
  getDefaultTheme,
  getThemeColor,
  onThemeChanged,
  applyThemeToBody,
  registerDarkModeQuery,
  themes,
  tryGetTheme
};
