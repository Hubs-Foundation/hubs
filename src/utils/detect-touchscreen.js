// from https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
function detectTouchScreen() {
  let hasTouchScreen = false;
  if ("maxTouchPoints" in navigator) {
    hasTouchScreen = navigator.maxTouchPoints > 0;
  } else if ("msMaxTouchPoints" in navigator) {
    hasTouchScreen = navigator.msMaxTouchPoints > 0;
  } else {
    const mQ = window.matchMedia && matchMedia("(pointer:coarse)");
    if (mQ && mQ.media === "(pointer:coarse)") {
      hasTouchScreen = !!mQ.matches;
    } else if ("orientation" in window) {
      hasTouchScreen = true; // deprecated, but good fallback
    } else {
      // Only as a last resort, fall back to user agent sniffing
      const UA = navigator.userAgent;
      hasTouchScreen =
        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) || /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
    }
  }
  return hasTouchScreen;
}

let hackyMobileSafariTestValue = null;

// HACK for https://github.com/mozilla/hubs/issues/1813
// Touchscreen controls depend on iPad and iPhone detection,
// which recently regressed. For UA matching "Macintosh", enable
// touchscreen controls if there exists a touchscreen.
// We cannot always enable touchscreen controls when a touchscreen
// is present until we fix conflicts between simultaneous mouse
// and touchscreen interactions.
export function hackyMobileSafariTest() {
  if (hackyMobileSafariTestValue === null) {
    hackyMobileSafariTestValue = /\b(Macintosh|iPad|iPhone)\b/i.test(navigator.userAgent) && detectTouchScreen();
  }

  return hackyMobileSafariTestValue;
  // e.g. Match
  // Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Safari/605.1.15
  // but not
  // "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36"
}
