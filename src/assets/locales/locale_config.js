// Certain locales are duplicates such as "zh-cn" and "zh" or "en-us" and "en".
// For non "en" (since it's the default), use this mapping to define a fallback,
// which will only be used if the specified locale file doesn't exist.

export const FALLBACK_LOCALES = {
  "zh-cn": "zh",
  "zh-hans": "zh",
  "zh-hans-cn": "zh"
};
