import { useEffect, useState } from "react";

let config = process.env.APP_CONFIG;

// Storybook includes environment variables as a string
// https://storybook.js.org/docs/react/configure/environment-variables
if (!config && process.env.STORYBOOK_APP_CONFIG) {
  config = JSON.parse(process.env.STORYBOOK_APP_CONFIG);
}

export const themes = config && config.themes;

function useDarkMode() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const darkmodeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    setDarkMode(darkmodeQuery.matches);

    darkmodeQuery.addEventListener("change", event => {
      setDarkMode(event.matches);
    });
  }, []);

  return darkMode;
}

export function useTheme(themeId) {
  const darkMode = useDarkMode();

  useEffect(
    () => {
      let theme;

      if (themeId) {
        theme = themes.find(t => t.id === themeId);
      } else if (darkMode) {
        theme = themes.find(t => t.darkModeDefault);
      } else {
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

      document.head.insertBefore(styleTag, document.head.firstChild);

      return () => {
        document.head.removeChild(styleTag);
      };
    },
    [themeId, darkMode]
  );
}
