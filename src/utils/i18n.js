import configs from "./configs";
import localeData from "../assets/translations.data.json";

function getLocales() {
  if (navigator.languages) {
    return navigator.languages;
  }
  if (navigator.language) {
    return [navigator.language];
  }
  if (navigator.userLanguage) {
    return [navigator.userLanguage];
  }
}

function getLang(locale) {
  // some locales require fallbacks in case of possible duplicated listings e.g. zh and zh-cn
  if (localeData[locale]) {
    const fallbackLang = localeData[locale];
    if (typeof fallbackLang === "string" && localeData[fallbackLang]) {
      return fallbackLang;
    } else {
      return locale;
    }
  }
  return null;
}

function getLangFromLocales(locales) {
  for (let i = 0; i < locales.length; i++) {
    const lang = getLang(locales[i].toLowerCase());
    if (lang) {
      return lang;
    }
  }
}

const locales = getLocales();
export const lang = getLangFromLocales(locales) || "en";

const _messages = localeData[lang] || localeData.en;

if (configs.APP_CONFIG && configs.APP_CONFIG.translations && configs.APP_CONFIG.translations[lang]) {
  const configTranslations = configs.APP_CONFIG.translations[lang];
  for (const messageKey in configTranslations) {
    if (!configTranslations.hasOwnProperty(messageKey)) continue;
    if (!configTranslations[messageKey]) continue;
    _messages[messageKey] = configTranslations[messageKey];
  }
}

const entries = [];
for (const key in _messages) {
  if (!_messages.hasOwnProperty(key)) continue;
  entries.push([key, _messages[key]]);
}

export const messages = entries
  .map(([key, message]) => [
    key,
    // Replace nested message keys (e.g. %app-name%) with their messages.
    message.replace(/%([\w-.]+)%/i, (_match, subkey) => _messages[subkey])
  ])
  .reduce((acc, entry) => {
    acc[entry[0]] = entry[1];
    return acc;
  }, {});
