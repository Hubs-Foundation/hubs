export function getAbsoluteUrl(baseUrl, relativeUrl) {
  return new URL(relativeUrl, baseUrl);
}
export function getAbsoluteHref(baseUrl, relativeUrl) {
  return getAbsoluteUrl(baseUrl, relativeUrl).href;
}
