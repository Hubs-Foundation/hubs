import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";
import { tryGetTheme, getCurrentTheme, registerDarkModeQuery } from "../../utils/theme";

function useDarkMode() {
  const [darkMode, setDarkMode] = useState(false);

  const changeListener = useCallback(
    event => {
      setDarkMode(event.matches);
    },
    [setDarkMode]
  );

  useEffect(() => {
    const [darkModeQuery, removeListener] = registerDarkModeQuery(changeListener);

    setDarkMode(darkModeQuery.matches);

    return removeListener;
  }, [changeListener]);

  return darkMode;
}

export function useTheme(themeId) {
  const darkMode = useDarkMode();

  useEffect(() => {
    const theme = tryGetTheme(themeId);

    if (!theme) {
      return;
    }

    const variables = [];

    for (const key in theme.variables) {
      if (!Object.prototype.hasOwnProperty.call(theme.variables, key)) continue;
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
  }, [themeId, darkMode]);
}

function getAppLogo(darkMode) {
  const theme = getCurrentTheme();
  const shouldUseDarkLogo = theme ? theme.darkModeDefault || theme.id.includes("dark-mode") : darkMode;
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
