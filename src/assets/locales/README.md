# Adding Locales

1. Copy an existing locale (e.g. [en.json](en.json)) to a new file using appropriate locale code as filename. (e.g. [zh.json](zh.json))
   * For locales that have duplicate codes (e.g. `zh` and `zh-ch`), edit [locale_config.js](locale_config.js) to define the fallback locale so that the locale file doesn't need to be duplicated.
2. Edit your new locale file with your translations.