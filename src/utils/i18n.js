import localeData from "../assets/translations.data.json";
const navigatorLang = ((navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage)
  .toLowerCase()
  .split(/[_-]+/)[0];
export const lang = (localeData[navigatorLang] && navigatorLang) || "en";

export const messages = localeData[lang] || localeData.en;

if (window.APP_CONFIG.translations && window.APP_CONFIG.translations[lang]) {
  const configTranslations = window.APP_CONFIG.translations[lang];
  for (const messageKey in configTranslations) {
    if (!configTranslations.hasOwnProperty(messageKey)) continue;
    if (!configTranslations[messageKey]) continue;
    messages[messageKey] = configTranslations[messageKey];
  }
}
