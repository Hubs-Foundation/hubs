import { detect } from "detect-browser";

const browser = detect();
const browserIsSafari = ["iOS", "Mac OS"].includes(browser.os) && ["safari", "ios"].includes(browser.name);

export function isSafari() {
  return browserIsSafari;
}
