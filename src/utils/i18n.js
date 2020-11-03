import configs from "./configs";
import { AVAILABLE_LOCALES, FALLBACK_LOCALES } from "../assets/locales/locale_config";
import defaultLocaleData from "../assets/locales/en.json";

const DEFAULT_LOCALE = "en";
const cachedMessages = new Map();

let _locale = DEFAULT_LOCALE;
let _localeData = defaultLocaleData;

function findLocale() {
  const locales = (() => {
    if (navigator.languages) {
      return [...navigator.languages];
    }
    if (navigator.language) {
      return [navigator.language];
    }
    if (navigator.userLanguage) {
      return [navigator.userLanguage];
    }
  })();

  const preferences = window.APP.store.state.preferences;

  if (preferences.locale && preferences.locale !== "browser") {
    locales.unshift(preferences.locale);
  }

  let locale = DEFAULT_LOCALE;
  for (let i = 0; i < locales.length; i++) {
    locale = locales[i].toLowerCase();

    if (!AVAILABLE_LOCALES[locale]) {
      if (FALLBACK_LOCALES[locale]) {
        return FALLBACK_LOCALES[locale];
      } else {
        continue;
      }
    }
    return locale;
  }
}

function updateLocale() {
  const locale = findLocale();

  if (locale === DEFAULT_LOCALE) {
    _locale = locale;
    _localeData = defaultLocaleData;
    document.body.dispatchEvent(new CustomEvent("locale-updated"));
  } else {
    if (cachedMessages.has(locale)) {
      _locale = locale;
      document.body.dispatchEvent(new CustomEvent("locale-updated"));
    } else {
      import(`../assets/locales/${locale}.json`).then(({ default: localeData }) => {
        _locale = locale;
        _localeData = localeData;
        document.body.dispatchEvent(new CustomEvent("locale-updated"));
      });
    }
  }
}

const interval = window.setInterval(() => {
  if (window.APP && window.APP.store) {
    window.clearInterval(interval);
    updateLocale();
    window.APP.store.addEventListener("statechanged", () => {
      updateLocale();
    });
  }
}, 100);

export const getLocale = () => {
  return _locale;
};

export const getMessages = () => {
  if (cachedMessages.has(_locale)) {
    return cachedMessages.get(_locale);
  }

  // Swap in translations specified via the admin panel
  if (configs.APP_CONFIG && configs.APP_CONFIG.translations && configs.APP_CONFIG.translations[_locale]) {
    const configTranslations = configs.APP_CONFIG.translations[_locale];
    for (const messageKey in configTranslations) {
      if (!configTranslations.hasOwnProperty(messageKey)) continue;
      if (!configTranslations[messageKey]) continue;
      _localeData[messageKey] = configTranslations[messageKey];
    }
  }

  const entries = [];
  for (const key in _localeData) {
    if (!_localeData.hasOwnProperty(key)) continue;
    entries.push([key, _localeData[key]]);
  }

  const messages = entries
    .map(([key, message]) => [
      key,
      // Replace nested message keys (e.g. %app-name%) with their messages.
      message.replace(/%([\w-.]+)%/i, (_match, subkey) => _localeData[subkey])
    ])
    .reduce((acc, entry) => {
      acc[entry[0]] = entry[1];
      return acc;
    }, {});

  cachedMessages.set(_locale, messages);
  return messages;
};
