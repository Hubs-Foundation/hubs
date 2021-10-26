import configs from "./configs";

// TODO: import this
const themes = window.APP_CONFIG?.theme?.themes || [];

function getCurrentTheme() {
  // TODO don't dupe this code like this
  if (!Array.isArray(themes)) return;

  const preferredThemeId = APP.store?.state?.preferences?.theme;
  if (preferredThemeId) {
    return themes.find(t => t.id === preferredThemeId);
  }

  const darkmodeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const darkMode = darkmodeQuery.matches;
  return (darkMode && themes.find(t => t.darkModeDefault)) || themes.find(t => t.default);
}

export function getAppLogo() {
  const theme = getCurrentTheme();
  const shouldUseDarkLogo = theme && theme.darkModeDefault;
  return (shouldUseDarkLogo && configs.image("logo_dark")) || configs.image("logo");
}
