import configs from "./configs";
import localeData from "../assets/translations.data.json";

const navigatorLang = ((navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage)
  .toLowerCase()
  .split(/[_-]+/)[0];
export const lang = (localeData[navigatorLang] && navigatorLang) || "en";

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
