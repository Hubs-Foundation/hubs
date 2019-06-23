import screenfull from "screenfull";

let hasEnteredFullScreenThisSession = false;

function shouldShowFullScreen() {
  // Disable full screen on iOS, since Safari's fullscreen mode does not let you prevent native pinch-to-zoom gestures.
  return (
    (AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR()) &&
    !AFRAME.utils.device.isIOS() &&
    screenfull.enabled
  );
}

export function willRequireUserGesture() {
  return !screenfull.isFullscreen && shouldShowFullScreen();
}

export function showFullScreenIfAvailable() {
  if (shouldShowFullScreen()) {
    screenfull.request();
    hasEnteredFullScreenThisSession = true;
  }
}

export function showFullScreenIfWasFullScreen() {
  if (hasEnteredFullScreenThisSession && !screenfull.isFullscreen) {
    screenfull.request();
  }
}
