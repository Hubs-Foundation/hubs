// What this screen-orientation-utils does are
// 1. Hide the screen orientation API difference across browsers
//    ScreenOrientation API should be used but Safari doesn't support it yet.
//    Instead deprecated window.orientation and orientationchange event
//    need to be used on Safari for now.
// 2. Manage maxResolution preferences values based on the screen orientation

import { isIOS as detectIOS } from "./is-mobile";

const isIOS = detectIOS();

export const addOrientationChangeListener = (callback, useCapture = false) => {
  if (typeof ScreenOrientation !== "undefined") {
    screen.orientation.addEventListener("change", callback, useCapture);
  } else {
    window.addEventListener("orientationchange", callback, useCapture);
  }
};

export const removeOrientationChangeListener = (callback, useCapture = false) => {
  if (typeof ScreenOrientation !== "undefined") {
    screen.orientation.removeEventListener("change", callback, useCapture);
  } else {
    window.removeEventListener("orientationchange", callback, useCapture);
  }
};

const getAngle = () => {
  return typeof ScreenOrientation !== "undefined" ? screen.orientation.angle : window.orientation;
};

const isNaturalOrientation = () => {
  return getAngle() % 180 === 0;
};

// Return the screen width based on the current screen orientation
const getScreenWidth = () => {
  // Is seems screen.width value is based on the natural screen orientation on iOS
  // while it is based on the current screen orientation on Android (and other devices?).
  if (isIOS) {
    return isNaturalOrientation() ? screen.width : screen.height;
  }
  return screen.width;
};

// Return the screen height based on the current screen orientation
const getScreenHeight = () => {
  // Is seems screen.height value is based on the natural screen orientation on iOS
  // while it is based on the current screen orientation on Android (and other devices?).
  if (isIOS) {
    return isNaturalOrientation() ? screen.height : screen.width;
  }
  return screen.height;
};

// Take width and height based on the current screen orientation and
// store them based on natural orientation
export const setMaxResolution = (store, width, height) => {
  store.update({
    preferences: {
      maxResolutionWidth: isNaturalOrientation() ? width : height,
      maxResolutionHeight: isNaturalOrientation() ? height : width
    }
  });
};

// Return width based on the current screen orientation
export const getMaxResolutionWidth = store => {
  const preferences = store.state.preferences;
  const width = isNaturalOrientation() ? preferences.maxResolutionWidth : preferences.maxResolutionHeight;
  return width !== undefined ? width : getScreenWidth();
};

// Return height based on the current screen orientation
export const getMaxResolutionHeight = store => {
  const preferences = store.state.preferences;
  const height = isNaturalOrientation() ? preferences.maxResolutionHeight : preferences.maxResolutionWidth;
  return height !== undefined ? height : getScreenHeight();
};
