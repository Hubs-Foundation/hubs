import screenfull from "screenfull";
import { showFullScreenIfWasFullScreen } from "./fullscreen";
const { detect } = require("detect-browser");

const browser = detect();
let isExitingFullscreenDueToFocus = false;

// Utility function that handles a bunch of incidental stuff related to text fields:
//
// - On non-mobile platforms, selects the value on focus
// - If full screen, exits/enters full screen because of firefox full screen issues
export function handleTextFieldFocus(target) {
  if (!window.AFRAME) return;
  const isMobile = AFRAME.utils.device.isMobile();

  if (screenfull.isFullscreen && !AFRAME.utils.device.isMobileVR() && browser.name === "firefox") {
    // This will prevent focus, but its the only way to avoid getting into a
    // weird "firefox reports full screen but actually not". You end up having to tap
    // twice to ultimately get the focus.
    //
    // We need to keep track of a bit here so that we don't re-full screen when
    // the text box is blurred by the browser.

    isExitingFullscreenDueToFocus = true;
    screenfull.exit().then(() => {
      target.focus();
    });
  }

  if (!isMobile) target.select();
}

export function handleTextFieldBlur() {
  // This is the incidental blur event when exiting fullscreen mode on mobile
  if (isExitingFullscreenDueToFocus) {
    isExitingFullscreenDueToFocus = false;
    return;
  }

  showFullScreenIfWasFullScreen();
}
