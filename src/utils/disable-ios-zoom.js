export function disableiOSZoom() {
  if (!AFRAME.utils.device.isIOS()) return;

  let lastTouchAtMs = 0;

  document.addEventListener("touchmove", ev => {
    if (ev.scale === 1) return;

    ev.preventDefault();
  });

  document.addEventListener("touchend", ev => {
    const now = new Date().getTime();
    const isDoubleTouch = now - lastTouchAtMs <= 300;
    lastTouchAtMs = now;

    if (isDoubleTouch) {
      ev.preventDefault();
    }
  });
}
