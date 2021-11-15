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

export async function showFullScreenIfAvailable() {
  if (shouldShowFullScreen()) {
    hasEnteredFullScreenThisSession = true;
    await screenfull.request();
  }
}

export async function showFullScreenIfWasFullScreen() {
  if (hasEnteredFullScreenThisSession && !screenfull.isFullscreen) {
    await screenfull.request();
  }
}
