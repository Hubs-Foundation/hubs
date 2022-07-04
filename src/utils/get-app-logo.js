import configs from "./configs";
import { themes } from "../react-components/styles/theme";
import { getColorSchemePref } from "./get-color-scheme-pref";

function getCurrentTheme() {
  if (!Array.isArray(themes)) return;

  const preferredThemeId = window.APP.store?.state?.preferences?.theme;
  if (preferredThemeId) {
    return themes.find(t => t.id === preferredThemeId);
  } else {
    return getColorSchemePref();
  }
}

export function getAppLogo() {
  const theme = getCurrentTheme();
  const shouldUseDarkLogo = !!(theme && theme.darkModeDefault);
  return (shouldUseDarkLogo && configs.image("logo_dark")) || configs.image("logo");
}
