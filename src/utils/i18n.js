import localeData from "../assets/translations.data.json";
const navigatorLang = ((navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage)
  .toLowerCase()
  .split(/[_-]+/)[0];
export const lang = (localeData[navigatorLang] && navigatorLang) || "en";

export const messages = localeData[lang] || localeData.en;

for (const appConfigKey in window.APP_CONFIG) {
  if (!window.APP_CONFIG.hasOwnProperty(appConfigKey)) continue;
  if (!appConfigKey.startsWith("translations_")) continue;
  const [, lang, ...messageKeyParts] = appConfigKey.split("_");
  if (lang !== lang) continue;

  const messageKey = messageKeyParts.join("_");
  messages[messageKey] = window.APP_CONFIG[appConfigKey];
}
