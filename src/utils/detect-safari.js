import { detect } from "detect-browser";

export function isSafari() {
  const browser = detect();
  return ["iOS", "Mac OS"].includes(browser.os) && ["safari", "ios"].includes(browser.name);
}
