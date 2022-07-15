import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { getColorSchemePref } from "../../utils/get-color-scheme-pref";
import configs from "../../utils/configs";

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
    `Custom themes failed to load.\n${
      config.theme.error
    }\nIf you are an admin, reconfigure your themes in the admin panel.`
  );
}

export const defaultTheme = "default";

export const themes = config?.theme?.themes || [];

function useDarkMode() {
  const [darkMode, setDarkMode] = useState(false);

  const changeListener = useCallback(
    event => {
      setDarkMode(event.matches);
    },
    [setDarkMode]
  );

  useEffect(
    () => {
      const darkmodeQuery = window.matchMedia("(prefers-color-scheme: dark)");

      setDarkMode(darkmodeQuery.matches);

      // This is a workaround for old Safari.
      // Prior to Safari 14, MediaQueryList is based on EventTarget, so you must use
      // addListener() and removeListener() to observe media query lists.
      // https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList/addListener
      // We may remove this workaround when no one will use Safari 13 or before.
      if (darkmodeQuery.addEventListener) {
        darkmodeQuery.addEventListener("change", changeListener);
      } else {
        darkmodeQuery.addListener(changeListener);
      }

      return () => {
        if (darkmodeQuery.removeEventListener) {
          darkmodeQuery.removeEventListener("change", changeListener);
        } else {
          darkmodeQuery.removeListener(changeListener);
        }
      };
    },
    [changeListener]
  );

  return darkMode;
}

export function useTheme(themeId) {
  const darkMode = useDarkMode();

  useEffect(
    () => {
      // Themes can come from an external source. Ensure it is an array.
      if (!Array.isArray(themes)) return;

      let theme;

      if (themeId) {
        theme = themes.find(t => t.id === themeId);
      }

      if (!theme && darkMode) {
        theme = themes.find(t => t.darkModeDefault);
      }

      if (!theme) {
        theme = themes.find(t => t.default);
      }

      if (!theme) {
        return;
      }

      const variables = [];

      for (const key in theme.variables) {
        if (!theme.variables.hasOwnProperty(key)) continue;
        variables.push(`--${key}: ${theme.variables[key]};`);
      }

      const styleTag = document.createElement("style");

      styleTag.innerHTML = `:root {
        ${variables.join("\n")}
      }`;

      document.head.appendChild(styleTag);

      return () => {
        document.head.removeChild(styleTag);
      };
    },
    [themeId, darkMode]
  );
}

function getCurrentTheme() {
  if (!Array.isArray(themes)) return;

  const preferredThemeId = window.APP.store?.state?.preferences?.theme;
  if (preferredThemeId) {
    return themes.find(t => t.id === preferredThemeId);
  } else {
    return getColorSchemePref();
  }
}

function getAppLogo(darkMode) {
  const theme = getCurrentTheme();
  const shouldUseDarkLogo = theme ? theme.darkModeDefault : darkMode;
  return (shouldUseDarkLogo && configs.image("logo_dark")) || configs.image("logo");
}

export function useLogo() {
  const darkMode = useDarkMode();
  return getAppLogo(darkMode);
}

export function useThemeFromStore(store) {
  const [themeId, setThemeId] = useState(store?.state?.preferences?.theme);

  useEffect(() => {
    function onStoreChanged() {
      const nextThemeId = store.state?.preferences?.theme;

      if (themeId !== nextThemeId) {
        setThemeId(nextThemeId);
      }
    }

    if (store) {
      store.addEventListener("statechanged", onStoreChanged);
    }

    return () => {
      if (store) {
        store.removeEventListener("statechanged", onStoreChanged);
      }
    };
  });

  useTheme(themeId);
}

export function ThemeProvider({ store, children }) {
  useThemeFromStore(store);
  return children;
}

ThemeProvider.propTypes = {
  store: PropTypes.object,
  children: PropTypes.node
};
