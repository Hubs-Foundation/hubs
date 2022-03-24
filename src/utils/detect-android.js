import { detect } from "detect-browser";

export function isAndroid() {
  const browser = detect();
  return ["Android OS"].includes(browser.os);
}
