# Localization

## Adding Locales

1. Add an entry to `AVAILABLE_LOCALES` in [locale_config.js](locale_config.js) with the appropriate locale code and in-language translation of the language.
2. Copy an existing locale (e.g. [en.json](en.json)) to a new file using appropriate locale code as filename. (e.g. [zh.json](zh.json))
   * For locales that have duplicate codes (e.g. `zh` and `zh-ch`), edit `FALLBACK_LOCALES` in [locale_config.js](locale_config.js) to define the fallback locale so that the locale file doesn't need to be duplicated.
3. Edit your new locale file with your translations.

## Adding to existing Locales

1. Add your new key and translation to [en.json](en.json).
2. Run `node sync_locales.js` in this directory. This will sync any new keys and translations made in `en.json` to all the other locale files.
3. Update the other locale files with correct translations if available.