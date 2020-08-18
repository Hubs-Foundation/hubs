# Adding Locales

1. Copy an existing locale (e.g. [en.json](en.json)) to a new file using appropriate locale code as filename. (e.g. [zh.json](zh.json))
   * For locales that have duplicate codes (e.g. `zh` and `zh-ch`), edit [locale_config.js](locale_config.js) to define the fallback locale so that the locale file doesn't need to be duplicated.
2. Edit your new locale file with your translations.

# Adding to existing Locales

1. Add your new key and translation to [en.json](en.json).
2. Add the key and translation (either the same english translation from step 1, or the correct language equivalent if available, to the other locale files).