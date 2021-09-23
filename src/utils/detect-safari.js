import { detect } from "detect-browser";

export function isSafari() {
  const browser = detect();
  if (!browser) return false;
  return ["iOS", "Mac OS"].includes(browser.os) && ["safari", "ios"].includes(browser.name);
}
