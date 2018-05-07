/**
 * Mobile Safari will start Audio contexts in a "suspended" state.
 * A user interaction (touch event) is needed in order to resume the AudioContext.
 */
const iDevices = /\biPhone.*Mobile|\biPod|\biPad|AppleCoreMedia/;

if (iDevices.test(navigator.userAgent) || /Chrome/.test(navigator.userAgent)) {
  document.addEventListener("DOMContentLoaded", () => {
    const ctx = THREE.AudioContext.getContext();

    function resume() {
      ctx.resume();

      setTimeout(function() {
        if (ctx.state === "running") {
          document.body.removeEventListener("touchend", resume, false);
          document.body.removeEventListener("mouseup", resume, false);
        }
      }, 0);
    }

    document.body.addEventListener("touchend", resume, false);
    document.body.addEventListener("mouseup", resume, false);
  });
}
