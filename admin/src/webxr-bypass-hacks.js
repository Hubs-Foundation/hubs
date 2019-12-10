/*
HACK Fix a-frame's device detection in Chrome when WebXR or WebVR flags are enabled in
chrome://flags. See https://github.com/mozilla/hubs/issues/892
*/
if (!/Oculus/.test(navigator.userAgent) && navigator.xr && !navigator.xr.requestDevice) {
  navigator.xr.requestDevice = () => Promise.reject({ message: "Hubs: requestDevice not supported." });
}
