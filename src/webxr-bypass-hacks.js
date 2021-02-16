import qsTruthy from "./utils/qs_truthy";

const isOculusBrowser = /oculusbrowser/i.test(navigator.userAgent);
const isMobileVR = /mobile vr/i.test(navigator.userAgent);
const isFirefox = /firefox/i.test(navigator.userAgent);
const hasWebVRapi = "getVRDisplays" in navigator;

/*
HACK: Our fork of aframe will read this global in src/utils/device.js to force the WebVR codepaths.
For now we want to continue using WebVR in Firefox on desktop and Firefox Reality.
*/
const isNonFirefoxWebXR = !isFirefox && "xr" in navigator && "requestSession" in navigator.xr;
window.forceWebVR = !qsTruthy("no_force_webvr") && (!isNonFirefoxWebXR || hasWebVRapi);

/*
HACK Fix a-frame's device detection in Chrome when WebXR or WebVR flags are enabled in
chrome://flags. See https://github.com/mozilla/hubs/issues/892
*/
if (!isMobileVR && !isNonFirefoxWebXR && navigator.xr && !navigator.xr.requestDevice) {
  navigator.xr.requestDevice = () => Promise.reject({ message: "Hubs: requestDevice not supported." });
}

/*
HACK Call getVRDisplays to force Oculus Browser to use WebVR, which in turn disables the WebXR API.
This should only take effect in older version of Oculus Browser that still have the getVRDisplays API.
*/
if (isOculusBrowser && hasWebVRapi) {
  navigator.getVRDisplays();
}
