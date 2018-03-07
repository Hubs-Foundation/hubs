const { detect } = require("detect-browser");
const browser = detect();

// Precision on device detection is fuzzy -- we can sometimes know if a device is definitely
// available, or definitely *not* available, and assume it may be available otherwise.
export const VR_DEVICE_AVAILABILITY = {
  yes: "yes", // Implies VR can be launched into on this device immediately, in this browser
  no: "no", // Implies this VR device is definitely not supported regardless of browser
  maybe: "maybe" // Implies this device may support this VR platform, but may not be installed or in a compatible browser
};

function hasPhysicalScreenDimensions(w, h) {
  const dpr = window.devicePixelRatio;
  const width = screen.width * dpr;
  const height = screen.height * dpr;

  // Compensate for rounding error due to fractional pixel densities
  return Math.abs(w - width) < 3 && Math.abs(h - height) < 3;
}

function matchesScreenSizesAndUserAgentRegexes(sizes, regexes) {
  return !!(sizes.find(s => hasPhysicalScreenDimensions(...s)) && regexes.find(r => navigator.userAgent.match()));
}

function isMaybeGearVRCompatibleDevice() {
  // Modern Samsung Galaxy devices have model numbers in the user agent of the form SX-XXXX or GT-XXXX for note 8
  return matchesScreenSizesAndUserAgentRegexes([[1440, 2560], [1440, 2960]], [/\WS.-.....?\W/, /\WGT-.....?\W/]);
}

function isMaybeDaydreamCompatibleDevice() {
  if (isMaybeGearVRCompatibleDevice()) return true;

  // List of resolutions of Pixel line of phones as well as other announced Daydream compatible
  // phones. This list may need to be updated as new phones roll out.
  return matchesScreenSizesAndUserAgentRegexes([[1080, 1920], [1440, 2560], [1440, 2880]], [/\WAndroid\W/]);
}

// Captures the potential ways a user can launch into mobile VR *before* a headset is attached to the phone.
// Tries to determine VR platform compatibility regardless of the current browser.
//
// For each mobile VR platform, returns "yes" if that platform can be launched into directly from this browser
// on this device, returns "no" if that platform cannot be supported on any browser, and "maybe" if the
// device potentially could support that platform if a different browser was running.
export async function getPreEntryMobileVRDeviceCaps() {
  const isWebVRCapableBrowser = !!navigator.getVRDisplays;
  const isDaydreamCapableBrowser = !!(isWebVRCapableBrowser && browser.name === "chrome");

  // We only consider GearVR hardware support as "maybe" and never return "yes" for GearVR. The only browser
  // that will detect GearVR outside of VR is Samsung Internet, and we'd prefer to launch into Oculus
  // Browser for now since Samsung Internet requires an additional WebVR installation + flag.
  const gearvr = isMaybeGearVRCompatibleDevice() ? VR_DEVICE_AVAILABILITY.maybe : VR_DEVICE_AVAILABILITY.no;

  // For daydream detection, we first check if they are on an Android compatible device, and assume they
  // may support daydream *unless* this browser has WebVR capabilities, in which case we can do better.
  let daydream = isMaybeDaydreamCompatibleDevice() ? VR_DEVICE_AVAILABILITY.maybe : VR_DEVICE_AVAILABILITY.no;

  if (isWebVRCapableBrowser) {
    // For daydream detection, if this is a WebVR browser we can increase confidence in daydream compatibility.
    const displays = await navigator.getVRDisplays();
    const hasDaydreamWebVRDevice = displays.find(d => d.displayName.match(/\Wdaydream\W/i));

    if (hasDaydreamWebVRDevice) {
      // If we detected daydream via WebVR
      daydream = VR_DEVICE_AVAILABILITY.yes;
    } else if (isDaydreamCapableBrowser) {
      // If we didn't detect daydream in a daydream capable browser, we definitely can't run daydream at all.
      daydream = VR_DEVICE_AVAILABILITY.no;
    }
  }

  return { gearvr, daydream };
}
