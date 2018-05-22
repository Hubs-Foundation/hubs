import MobileDetect from "mobile-detect";
const mobiledetect = new MobileDetect(navigator.userAgent);

export function disableiOSZoom() {
  if (!mobiledetect.is("iPhone") && !mobiledetect.is("iPad")) return;

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
