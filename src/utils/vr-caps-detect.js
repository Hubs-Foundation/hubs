const { detect } = require("detect-browser");
const browser = detect();

// Precision on device detection is fuzzy -- we can sometimes know if a device is definitely
// available, or definitely *not* available, and assume it may be available otherwise.
const VR_DEVICE_AVAILABILITY = {
  yes: "yes", // Implies VR can be launched into on this device immediately, in this browser
  no: "no", // Implies this VR device is definitely not supported regardless of browser
  maybe: "maybe" // Implies this device may support this VR device, but may not be installed or in the right browser
};

function hasPhysicalScreenDimensions(w, h) {
  const dpr = window.devicePixelRatio;
  const width = screen.width * dpr;
  const height = screen.height * dpr;

  // Compensate for rounding error due to fractional pixel densities
  return Math.abs(w - width) < 3 && Math.abs(h - height) < 3;
}

function matchesScreenSizesAndUserAgentRegex(sizes, regex) {
  return !!(sizes.find(s => hasPhysicalScreenDimensions(...s)) && navigator.userAgent.match(regex));
}

function isGearVRCompatibleDevice() {
  // Modern Samsung Galaxy devices have model numbers in the user agent of the form SX-XXXX
  return matchesScreenSizesAndUserAgentRegex([[1440, 2560], [1440, 2960]], /\WS.-.....?\W/);
}

function isGooglePixelPhone() {
  return matchesScreenSizesAndUserAgentRegex([[1080, 1920], [1440, 2560]], /\WPixel\W/);
}

function isKnownDaydreamCompatibleDevice() {
  // Samsung S6, S7, and Note 5 do not support Daydream, but other GearVR compatiable devices
  // do. Instead of doing fine-grained model detection we will just assume they are all compatible.
  if (isGearVRCompatibleDevice()) return true;
  if (isGooglePixelPhone()) return true;

  // Note this is non-exhaustive -- this function may return false for compatible devices.
  return false;
}

// Captures the potential ways a user can launch into mobile VR *before* a headset is attached to the phone.
// Tries to determine VR platform compatibility regardless of the current browser.
//
// For each mobile VR platform, returns "yes" if that platform can be launched into directly from this browser
// on this device, returns "no" if that platform cannot be supported on any browser, and "maybe" if the
// device potentially could support that platform if a different browser was running.
export async function getPreEntryMobileVRDeviceCaps() {
  const isWebVREnabled = !!navigator.getVRDisplays;
  const isWebVREnabledChrome = !!(isWebVREnabled && browser.name === "chrome");
  const isAndroidCompatible =
    navigator.userAgent.match(/\Wandroid\W/i) && !navigator.userAgent.match(/\Wwindows phone\W/i);

  // We only consider GearVR hardware support as "maybe" and never return "yes" for GearVR. The only browser
  // that will detect GearVR outside of VR is Samsung Internet, and we'd prefer to launch into Oculus
  // Browser for now since Samsung Internet requires an additional WebVR installation + flag.
  const gearvr = isGearVRCompatibleDevice() ? VR_DEVICE_AVAILABILITY.maybe : VR_DEVICE_AVAILABILITY.no;

  // For daydream detection, we first check if they are on an Android compatible device, and assume they
  // may support daydream *unless* this browser has WebVR capabilities, in which case we can do better.
  let daydream = isAndroidCompatible ? VR_DEVICE_AVAILABILITY.maybe : VR_DEVICE_AVAILABILITY.no;

  if (isWebVREnabled) {
    // For daydream detection, if this is a WebVR browser we can increase confidence in daydream compatibility.
    const displays = await navigator.getVRDisplays();
    const hasDaydreamWebVRDevice = displays.find(d => d.displayName.match(/\Wdaydream\W/i));

    if (hasDaydreamWebVRDevice) {
      // If we detected daydream via WebVR
      daydream = VR_DEVICE_AVAILABILITY.yes;
    } else if (isWebVREnabledChrome || !isKnownDaydreamCompatibleDevice()) {
      // If we didn't detect daydream in chrome (which is known to detect it) and we are on a known compatible device
      daydream = VR_DEVICE_AVAILABILITY.no;
    }
  }

  return { gearvr, daydream };
}
