import "@babel/polyfill";
import configs from "./configs";
import { FALLBACK_LOCALES } from "../assets/locales/locale_config";
import defaultLocaleData from "../assets/locales/en.json";

const DEFAULT_LOCALE = "en";

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

const locales = getLocales();

let _locale = DEFAULT_LOCALE;
let _messages = defaultLocaleData;

(async () => {
  for (let i = 0; i < locales.length; i++) {
    const locale = locales[i].toLowerCase();
    if (locale === DEFAULT_LOCALE) {
      break;
    }
    try {
      const { default: localeData } = await import(`../assets/locales/${locale}.json`);
      _locale = locale;
      _messages = localeData;
      break;
    } catch (e) {
      //locale file not found, try a fallback if available
      if (FALLBACK_LOCALES[locale]) {
        locales.push(FALLBACK_LOCALES[locale]);
      }
    }
  }
})();

export const getLocale = () => {
  return _locale;
};

export const getMessages = (() => {
  const cachedMessages = new Map();
  return () => {
    if (cachedMessages.has(_locale)) {
      return cachedMessages.get(_locale);
    }

    // Swap in translations specified via the admin panel
    if (configs.APP_CONFIG && configs.APP_CONFIG.translations && configs.APP_CONFIG.translations[_locale]) {
      const configTranslations = configs.APP_CONFIG.translations[_locale];
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

    const messages = entries
      .map(([key, message]) => [
        key,
        // Replace nested message keys (e.g. %app-name%) with their messages.
        message.replace(/%([\w-.]+)%/i, (_match, subkey) => _messages[subkey])
      ])
      .reduce((acc, entry) => {
        acc[entry[0]] = entry[1];
        return acc;
      }, {});

    cachedMessages.set(_locale, messages);
    return messages;
  };
})();
