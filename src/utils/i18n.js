import configs from "./configs";
import { AVAILABLE_LOCALES, FALLBACK_LOCALES } from "../assets/locales/locale_config";
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

let _locale = DEFAULT_LOCALE;
let _messages = defaultLocaleData;

function setLocale() {
  const locales = getLocales();

  const store = window.APP.store;

  if (store.state.preferences.locale && store.state.preferences.locale !== "browser") {
    locales.unshift(store.state.preferences.locale);
  }

  let locale = DEFAULT_LOCALE;
  for (let i = 0; i < locales.length; i++) {
    locale = locales[i].toLowerCase();

    if (!AVAILABLE_LOCALES[locale]) {
      if (FALLBACK_LOCALES[locale]) {
        locale = FALLBACK_LOCALES[locale];
        break;
      } else {
        continue;
      }
    }
    break;
  }

  if (locale === DEFAULT_LOCALE) {
    _locale = locale;
    _messages = defaultLocaleData;
    document.body.dispatchEvent(new CustomEvent("locale-updated"));
  } else {
    import(`../assets/locales/${locale}.json`).then(({ default: localeData }) => {
      _locale = locale;
      _messages = localeData;
      document.body.dispatchEvent(new CustomEvent("locale-updated"));
    });
  }
}

const interval = window.setInterval(() => {
  if (window.APP && window.APP.store) {
    window.clearInterval(interval);
    setLocale();
    window.APP.store.addEventListener("statechanged", () => {
      setLocale();
    });
  }
  console.log("POLL");
}, 100);

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
