/**
 * Chrome and Safari will start Audio contexts in a "suspended" state.
 * A user interaction (touch/mouse event) is needed in order to resume the AudioContext.
 */

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
