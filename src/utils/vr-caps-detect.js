import { isIOS } from "./is-mobile";

const { detect } = require("detect-browser");

const browser = detect();

// Precision on device detection is fuzzy -- we can sometimes know if a device is definitely
// available, or definitely *not* available, and assume it may be available otherwise.
export const VR_DEVICE_AVAILABILITY = {
  yes: "yes", // Implies VR can be launched into on this device immediately, in this browser
  no: "no", // Implies this VR device is definitely not supported regardless of browser
  maybe: "maybe" // Implies this device may support this VR platform, but may not be installed or in a compatible browser
};

function isMaybeGearVRCompatibleDevice(ua) {
  return /\WAndroid\W/.test(ua);
}

function isMaybeDaydreamCompatibleDevice(ua) {
  return /\WAndroid\W/.test(ua);
}

// Disallowed list of VR device name regex matchers that we do not want to consider as valid VR devices
// that can be entered into as a "generic" entry flow.
const GENERIC_ENTRY_TYPE_DISALLOWED_DEVICES = [/cardboard/i];

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
export async function getAvailableVREntryTypes() {
  const ua = navigator.userAgent;
  const isSamsungBrowser = browser.name === "chrome" && /SamsungBrowser/.test(ua);
  const isMobile = AFRAME.utils.device.isMobile();
  const isThisMobileVR = AFRAME.utils.device.isMobileVR();

  // This needs to be kept up-to-date with the latest browsers that can support VR and Hubs.
  // Checking for navigator.getVRDisplays always passes b/c of polyfill.
  const isWebVRCapableBrowser = window.hasNativeWebVRImplementation;
  const isWebXRCapableBrowser = window.hasNativeWebXRImplementation;

  const isDaydreamCapableBrowser = !!(isWebVRCapableBrowser && browser.name === "chrome" && !isSamsungBrowser);
  const isIDevice = isIOS();
  const isFirefoxBrowser = browser.name === "firefox";
  const isUIWebView = typeof navigator.mediaDevices === "undefined";

  const safari = isIDevice
    ? !isUIWebView
      ? VR_DEVICE_AVAILABILITY.yes
      : VR_DEVICE_AVAILABILITY.maybe
    : VR_DEVICE_AVAILABILITY.no;

  const isCardboardCapableBrowser = !!(isMobile && !isIDevice && browser.name === "chrome" && !isSamsungBrowser);

  let displays = [];
  try {
    // Skip getVRDisplays on desktop Chrome since the API is in a broken state there.
    // See https://github.com/Hubs-Foundation/hubs/issues/892
    if (browser.name !== "chrome" || isMobile) {
      // We pull the displays on non-WebVR capable mobile browsers so we can pick up cardboard.
      displays = isWebVRCapableBrowser || isCardboardCapableBrowser ? await navigator.getVRDisplays() : [];
    }
  } catch (e) {
    console.warn("navigator.getVRDisplays() failed", e);
  }

  const isOculusBrowser = /Oculus/.test(ua);

  const screen = isThisMobileVR
    ? VR_DEVICE_AVAILABILITY.no
    : isIDevice && isUIWebView
    ? VR_DEVICE_AVAILABILITY.maybe
    : VR_DEVICE_AVAILABILITY.yes;

  // HACK -- we prompt the user to install firefox if they click the VR button on a non-WebVR compatible
  // browser. Without this check if you have FF on Mac/Linux you'll get the confusing flow of having a
  // VR button but then being asked to download FF.
  const isNonWebVRFirefox = !isWebVRCapableBrowser && isFirefoxBrowser;
  let generic = isMobile || isNonWebVRFirefox ? VR_DEVICE_AVAILABILITY.no : VR_DEVICE_AVAILABILITY.maybe;
  let cardboard = VR_DEVICE_AVAILABILITY.no;

  // We only consider GearVR support as "maybe" and never "yes". The only browser
  // that will detect GearVR outside of VR is Samsung Internet, and we'd prefer to launch into Oculus
  // Browser for now since Samsung Internet requires an additional WebVR installation + flag, so return "maybe".
  //
  // If we are in Oculus Browser (ie, we are literally wearing a GearVR) then return 'yes'.
  let gearvr = VR_DEVICE_AVAILABILITY.no;
  if (isMaybeGearVRCompatibleDevice(ua)) {
    gearvr = isOculusBrowser ? VR_DEVICE_AVAILABILITY.yes : VR_DEVICE_AVAILABILITY.maybe;
  }

  // For daydream detection, we first check if they are on an Android compatible device, and assume they
  // may support daydream *unless* this browser has WebVR capabilities, in which case we can do better.
  let daydream =
    isMaybeDaydreamCompatibleDevice(ua) && !isThisMobileVR ? VR_DEVICE_AVAILABILITY.maybe : VR_DEVICE_AVAILABILITY.no;

  cardboard =
    isCardboardCapableBrowser && displays.find(d => d.capabilities.canPresent && /cardboard/i.test(d.displayName))
      ? VR_DEVICE_AVAILABILITY.yes
      : VR_DEVICE_AVAILABILITY.no;

  if (isWebVRCapableBrowser) {
    // Generic is supported for allowed devices and presentable HMDs.
    generic = displays.find(
      d => d.capabilities.canPresent && !GENERIC_ENTRY_TYPE_DISALLOWED_DEVICES.find(r => r.test(d.displayName))
    )
      ? VR_DEVICE_AVAILABILITY.yes
      : VR_DEVICE_AVAILABILITY.no;

    // For daydream detection, in a WebVR browser we can increase confidence in daydream compatibility.
    const hasDaydreamWebVRDevice = displays.find(d => /daydream/i.test(d.displayName));

    if (hasDaydreamWebVRDevice) {
      // If we detected daydream via WebVR
      daydream = VR_DEVICE_AVAILABILITY.yes;
      generic = VR_DEVICE_AVAILABILITY.no;
    } else if (isDaydreamCapableBrowser) {
      // If we didn't detect daydream in a daydream capable browser, we definitely can't run daydream at all.
      daydream = VR_DEVICE_AVAILABILITY.no;
    }
  }

  if (isWebXRCapableBrowser) {
    generic = true;
  }

  return { screen, generic, gearvr, daydream, cardboard, safari };
}

export const ONLY_SCREEN_AVAILABLE = {
  screen: VR_DEVICE_AVAILABILITY.yes,
  generic: VR_DEVICE_AVAILABILITY.no,
  gearvr: VR_DEVICE_AVAILABILITY.no,
  daydream: VR_DEVICE_AVAILABILITY.no,
  cardboard: VR_DEVICE_AVAILABILITY.no,
  safari: VR_DEVICE_AVAILABILITY.no
};
