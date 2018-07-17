const { detect } = require("detect-browser");

const browser = detect();

// Precision on device detection is fuzzy -- we can sometimes know if a device is definitely
// available, or definitely *not* available, and assume it may be available otherwise.
export const VR_DEVICE_AVAILABILITY = {
  yes: "yes", // Implies VR can be launched into on this device immediately, in this browser
  no: "no", // Implies this VR device is definitely not supported regardless of browser
  maybe: "maybe" // Implies this device may support this VR platform, but may not be installed or in a compatible browser
};

function isMaybeGearVRCompatibleDevice() {
  return navigator.userAgent.match(/\WAndroid\W/);
}

function isMaybeDaydreamCompatibleDevice() {
  return navigator.userAgent.match(/\WAndroid\W/);
}

// Blacklist of VR device name regex matchers that we do not want to consider as valid VR devices
// that can be entered into as a "generic" entry flow.
const GENERIC_ENTRY_TYPE_DEVICE_BLACKLIST = [/cardboard/i];

// Tries to determine VR entry compatibility regardless of the current browser.
//
// For each VR "entry type", returns VR_DEVICE_AVAILABILITY.yes if that type can be launched into directly from this browser
// on this device, returns VR_DEVICE_AVAILABILITY.no if that type is known to not be possible to ever use on this device no matter what,
// and VR_DEVICE_AVAILABILITY.maybe if the device potentially could support that type if a different browser was running, or if
// the software was setup, an HMD was purchased, etc.
//
// When "yes" or "maybe", we should present the option. If "maybe", when chosen try to get them into a compatible browser.
// Once in a compatible browser, we should assume it will work (if it doesn't, it's because they don't have the headset,
// haven't installed the software, our guess about their phone was wrong, etc.)
//
// At the time of this writing there are the following VR "entry types" that will be validated by this method:
//
// - screen: Enter "on-screen" in 2D
// - generic: Generic WebVR (platform/OS agnostic indicator if a general 'Enter VR' option should be presented.)
// - daydream: Google Daydream
// - gearvr: Oculus GearVR
// - cardboard: Google Cardboard
//
// This function also detects if the user is already in a headset, and returns the isInHMD key to be `true` if so.
export async function getAvailableVREntryTypes() {
  const isSamsungBrowser = browser.name === "chrome" && navigator.userAgent.match(/SamsungBrowser/);
  const isOculusBrowser = navigator.userAgent.match(/Oculus/);
  const isInHMD = isOculusBrowser;

  // This needs to be kept up-to-date with the latest browsers that can support VR and Hubs.
  // Checking for navigator.getVRDisplays always passes b/c of polyfill.
  const isWebVRCapableBrowser = window.hasNativeWebVRImplementation;

  const isDaydreamCapableBrowser = !!(isWebVRCapableBrowser && browser.name === "chrome" && !isSamsungBrowser);
  const isIDevice = AFRAME.utils.device.isIOS();
  const isFirefoxBrowser = browser.name === "firefox";
  const isUIWebView = typeof navigator.mediaDevices === "undefined";

  const safari = isIDevice
    ? !isUIWebView ? VR_DEVICE_AVAILABILITY.yes : VR_DEVICE_AVAILABILITY.maybe
    : VR_DEVICE_AVAILABILITY.no;

  const screen = isInHMD
    ? VR_DEVICE_AVAILABILITY.no
    : isIDevice && isUIWebView ? VR_DEVICE_AVAILABILITY.maybe : VR_DEVICE_AVAILABILITY.yes;

  let generic = AFRAME.utils.device.isMobile() ? VR_DEVICE_AVAILABILITY.no : VR_DEVICE_AVAILABILITY.maybe;
  let cardboard = VR_DEVICE_AVAILABILITY.no;

  // We only consider GearVR support as "maybe" and never "yes". The only browser
  // that will detect GearVR outside of VR is Samsung Internet, and we'd prefer to launch into Oculus
  // Browser for now since Samsung Internet requires an additional WebVR installation + flag, so return "maybe".
  //
  // If we are in Oculus Browser (ie, we are literally wearing a GearVR) then return 'yes'.
  let gearvr = VR_DEVICE_AVAILABILITY.no;
  if (isMaybeGearVRCompatibleDevice()) {
    gearvr = isOculusBrowser ? VR_DEVICE_AVAILABILITY.yes : VR_DEVICE_AVAILABILITY.maybe;
  }

  // For daydream detection, we first check if they are on an Android compatible device, and assume they
  // may support daydream *unless* this browser has WebVR capabilities, in which case we can do better.
  let daydream =
    isMaybeDaydreamCompatibleDevice() && !isInHMD ? VR_DEVICE_AVAILABILITY.maybe : VR_DEVICE_AVAILABILITY.no;

  if (isWebVRCapableBrowser) {
    const displays = await navigator.getVRDisplays();

    // Generic is supported for non-blacklisted devices and presentable HMDs.
    generic = displays.find(
      d => d.capabilities.canPresent && !GENERIC_ENTRY_TYPE_DEVICE_BLACKLIST.find(r => d.displayName.match(r))
    )
      ? VR_DEVICE_AVAILABILITY.yes
      : VR_DEVICE_AVAILABILITY.no;

    cardboard =
      !isIDevice &&
      !isFirefoxBrowser &&
      displays.find(d => d.capabilities.canPresent && d.displayName.match(/cardboard/i))
        ? VR_DEVICE_AVAILABILITY.yes
        : VR_DEVICE_AVAILABILITY.no;

    // For daydream detection, in a WebVR browser we can increase confidence in daydream compatibility.
    const hasDaydreamWebVRDevice = displays.find(d => d.displayName.match(/daydream/i));

    if (hasDaydreamWebVRDevice) {
      // If we detected daydream via WebVR
      daydream = VR_DEVICE_AVAILABILITY.yes;
      generic = VR_DEVICE_AVAILABILITY.no;
    } else if (isDaydreamCapableBrowser) {
      // If we didn't detect daydream in a daydream capable browser, we definitely can't run daydream at all.
      daydream = VR_DEVICE_AVAILABILITY.no;
    }
  }

  return { screen, generic, gearvr, daydream, cardboard, isInHMD, safari };
}
