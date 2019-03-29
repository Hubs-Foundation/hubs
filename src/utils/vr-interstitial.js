import { showFullScreenIfAvailable } from "./fullscreen";

let _isIn2DInterstitial = false;
const isMobileVR = AFRAME.utils.device.isMobileVR();

export function handleExitTo2DInterstitial(isLower) {
  const scene = document.querySelector("a-scene");
  if (!scene.is("vr-mode")) return;

  _isIn2DInterstitial = true;

  if (isMobileVR) {
    // Immersive browser, exit VR.
    scene.exitVR().then(() => {
      showFullScreenIfAvailable();
    });
  } else {
    // Non-immersive browser, show notice
    const vrNotice = document.querySelector(".vr-notice");
    vrNotice.object3D.visible = true;
    vrNotice.setAttribute("follow-in-fov", {
      angle: isLower ? 39 : -15
    });
  }
}

export function handleReEntryToVRFrom2DInterstitial() {
  if (!_isIn2DInterstitial) return;
  _isIn2DInterstitial = false;

  document.querySelector(".vr-notice").object3D.visible = false;

  if (isMobileVR) {
    const scene = document.querySelector("a-scene");
    scene.enterVR();
  }
}

export function isIn2DInterstitial() {
  return _isIn2DInterstitial;
}
