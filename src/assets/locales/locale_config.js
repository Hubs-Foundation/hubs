// Languages we support
export const AVAILABLE_LOCALES = {
  es: "Español", // Spanish
  en: "English", // English
  jp: "日本語", // Japanese
  pt: "Portugês (Brasil)", // Portuguese
  zh: "简体中文" // Chinese
  // TODO: Identify the varient of Chinese used.
  // (Mandarin, Cantonese, Gan, Hakka, Yue, Xiang)
  // (Traditional/Simplified script)
};

// Mapping from more-specific language tags to those available.
export const FALLBACK_LOCALES = {
  // Keys are intentionally lowercase
  // TODO: Listing all possible language tags is not how we should
  // be identifying the user's preferred language. We should instead
  // check the first subtag to identify the primary language.
  // A language tag carries more information than we are using:
  // [primary language subtag]
  // -[up to three extended language subtags]
  // -[optional script subtag]
  // -[optional region subtag]
  // -[optional variant subtag]
  // -[optional extension subtag]
  // -[optional private-use subtag]
  // See https://en.wikipedia.org/wiki/IETF_language_tag#Syntax_of_language_tags
  "en-ae": "en", // English
  "en-al": "en", // English
  "en-at": "en", // English
  "en-au": "en", // English (Australia)
  "en-be": "en", // English
  "en-bg": "en", // English
  "en-br": "en", // English
  "en-by": "en", // English
  "en-bz": "en", // English (Belize)
  "en-ca": "en", // English (Canada)
  "en-ch": "en", // English
  "en-cl": "en", // English
  "en-cn": "en", // English
  "en-cy": "en", // English
  "en-de": "en", // English
  "en-dk": "en", // English
  "en-ee": "en", // English
  "en-eg": "en", // English
  "en-en": "en", // English
  "en-es": "en", // English
  "en-fi": "en", // English
  "en-gb": "en", // English (United Kingdom)
  "en-gbr": "en", // English
  "en-gr": "en", // English
  "en-gu": "en", // English
  "en-he": "en", // English
  "en-hk": "en", // English
  "en-hu": "en", // English
  "en-id": "en", // English
  "en-ie": "en", // English (Ireland)
  "en-il": "en", // English
  "en-in": "en", // English
  "en-jm": "en", // English (Jamaica)
  "en-jo": "en", // English
  "en-jp": "en", // English
  "en-ke": "en", // English
  "en-lr": "en", // English
  "en-lv": "en", // English
  "en-mt": "en", // English
  "en-mx": "en", // English
  "en-my": "en", // English
  "en-na": "en", // English
  "en-new": "en", // English
  "en-nl": "en", // English
  "en-nz": "en", // English (New Zealand)
  "en-ph": "en", // English (Philippines)
  "en-pk": "en", // English
  "en-pl": "en", // English
  "en-qa": "en", // English
  "en-rs": "en", // English
  "en-ru": "en", // English
  "en-sa": "en", // English
  "en-sd": "en", // English
  "en-se": "en", // English
  "en-sg": "en", // English
  "en-si": "en", // English
  "en-sk": "en", // English
  "en-th": "en", // English
  "en-tr": "en", // English
  "en-tt": "en", // English (Trinidad & Tobago)
  "en-tur": "en", // English
  "en-ua": "en", // English
  "en-ug": "en", // English
  "en-uk": "en", // English
  "en-us": "en", // English (United States)
  "en-vg": "en", // English
  "en-vi": "en", // English
  "en-vn": "en", // English
  "en-ws": "en", // English
  "en-xa": "en", // English
  "en-za": "en", // English (South Africa)
  "en-zg": "en", // English
  "en-zw": "en", // English (Zimbabwe)
  "es-419": "es", // Spanish (Latin America and the Caribbean)
  "es-ar": "es", // Spanish (Argentina)
  "es-bo": "es", // Spanish (Bolivia)
  "es-br": "es", // Spanish
  "es-cl": "es", // Spanish (Chile)
  "es-co": "es", // Spanish (Colombia)
  "es-cr": "es", // Spanish (Costa Rica)
  "es-do": "es", // Spanish (Dominican Republic)
  "es-ec": "es", // Spanish (Ecuador)
  "es-es": "es", // Spanish (Spain)
  "es-eu": "es", // Spanish
  "es-gb": "es", // Spanish
  "es-gt": "es", // Spanish (Guatemala)
  "es-hn": "es", // Spanish (Honduras)
  "es-la": "es", // Spanish
  "es-mx": "es", // Spanish (Mexico)
  "es-ni": "es", // Spanish (Nicaragua)
  "es-pa": "es", // Spanish (Panama)
  "es-pe": "es", // Spanish (Peru)
  "es-pr": "es", // Spanish
  "es-py": "es", // Spanish
  "es-sv": "es", // Spanish (El Salvador)
  "es-uy": "es", // Spanish (Uruguay)
  "es-us": "es", // Spanish
  "es-ve": "es", // Spanish (Venezuela)
  "es-xl": "es", // Spanish
  "zh-hans": "zh", // Chinese
  "zh-hans-cn": "zh", // Chinese
  "pt-br": "pt", // Portuguese (Brazil)
  "pt-en": "pt", // Portuguese
  "pt-pt": "pt", // Portuguese (Portugal)
  ja: "jp", // Japanese
  "ja-jp": "jp", // Japanese
  "ja-jp-mac": "jp", // Japanese
  "jp-jp": "jp" // Japanese
};
