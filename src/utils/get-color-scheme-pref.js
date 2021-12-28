import { themes } from "../react-components/styles/theme";

export function getColorSchemePref() {
  const darkmodeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const darkMode = darkmodeQuery.matches;
  return (darkMode && themes.find(t => t.darkModeDefault)) || themes.find(t => t.default);
}
