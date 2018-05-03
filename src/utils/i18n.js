import localeData from "../assets/translations.data.json";
const navigatorLang = ((navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage)
  .toLowerCase()
  .split(/[_-]+/)[0];
export const lang = (localeData[navigatorLang] && navigatorLang) || "en";
export const messages = localeData[lang] || localeData.en;
