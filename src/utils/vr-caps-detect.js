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
// At the time of this writing there are three VR "entry types" that will be validated by this method:
//
// - generic: Generic WebVR (platform/OS agnostic indicator if a general 'Enter VR' option should be presented.)
// - daydream: Google Daydream
// - gearvr: Oculus GearVR
//
export async function getAvailableVREntryTypes() {
  const isWebVRCapableBrowser = !!navigator.getVRDisplays;
  const isSamsungBrowser = browser.name === "chrome" && navigator.userAgent.match(/SamsungBrowser/);
  const isDaydreamCapableBrowser = !!(isWebVRCapableBrowser && browser.name === "chrome" && !isSamsungBrowser);

  let generic = VR_DEVICE_AVAILABILITY.no;

  // We only consider GearVR support as "maybe" and never "yes". The only browser
  // that will detect GearVR outside of VR is Samsung Internet, and we'd prefer to launch into Oculus
  // Browser for now since Samsung Internet requires an additional WebVR installation + flag, so return "maybe".
  const gearvr = isMaybeGearVRCompatibleDevice() ? VR_DEVICE_AVAILABILITY.maybe : VR_DEVICE_AVAILABILITY.no;

  // For daydream detection, we first check if they are on an Android compatible device, and assume they
  // may support daydream *unless* this browser has WebVR capabilities, in which case we can do better.
  let daydream = isMaybeDaydreamCompatibleDevice() ? VR_DEVICE_AVAILABILITY.maybe : VR_DEVICE_AVAILABILITY.no;

  if (isWebVRCapableBrowser) {
    const displays = await navigator.getVRDisplays();

    // Generic is supported for non-blacklisted devices and presentable HMDs.
    generic = displays.find(
      d => d.capabilities.canPresent && !GENERIC_ENTRY_TYPE_DEVICE_BLACKLIST.find(r => d.displayName.match(r))
    )
      ? VR_DEVICE_AVAILABILITY.yes
      : VR_DEVICE_AVAILABILITY.no;

    // For daydream detection, in a WebVR browser we can increase confidence in daydream compatibility.
    const hasDaydreamWebVRDevice = displays.find(d => d.displayName.match(/\Wdaydream\W/i));

    if (hasDaydreamWebVRDevice) {
      // If we detected daydream via WebVR
      daydream = VR_DEVICE_AVAILABILITY.yes;
      generic = VR_DEVICE_AVAILABILITY.no;
    } else if (isDaydreamCapableBrowser) {
      // If we didn't detect daydream in a daydream capable browser, we definitely can't run daydream at all.
      daydream = VR_DEVICE_AVAILABILITY.no;
    }
  }

  return { generic, gearvr, daydream };
}
