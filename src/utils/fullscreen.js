import screenfull from "screenfull";
import { isIOS } from "./is-mobile";

let hasEnteredFullScreenThisSession = false;

function shouldShowFullScreen() {
  // Disable full screen on iOS, since Safari's fullscreen mode does not let you prevent native pinch-to-zoom gestures.
  // Disable full screen if in an iframe to prevent conflicts
  return ( ( window.location == window.parent.location ) && AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR()) && !isIOS() && screenfull.enabled;
}

async function retryScreenFull(){
  await screenfull.request();
  document.body.removeEventListener("click",retryScreenFull);
}

export function willRequireUserGesture() {
  return !screenfull.isFullscreen && shouldShowFullScreen();
}

export async function showFullScreenIfAvailable() {
  if (shouldShowFullScreen() && !screenfull.isFullscreen) {
    hasEnteredFullScreenThisSession = true;
    try{
      await screenfull.request();
    }catch(e) {
      // prevent crash when entering without user interaction
      document.body.addEventListener("click",retryScreenFull)
    }

  }
}

export async function showFullScreenIfWasFullScreen() {
  if (hasEnteredFullScreenThisSession && !screenfull.isFullscreen) {
    await screenfull.request();
  }
}
