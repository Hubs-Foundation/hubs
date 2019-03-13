import { detectInHMD } from "./vr-caps-detect";
import { showFullScreenIfAvailable } from "./fullscreen";

let isIn2DInterstitial = false;

export function handleExitTo2DInterstitial(isLower) {
  const scene = document.querySelector("a-scene");
  if (!scene.is("vr-mode")) return;

  isIn2DInterstitial = true;

  if (detectInHMD()) {
    // Immersive browser, exit VR.
    scene.exitVR();
    showFullScreenIfAvailable();
  } else {
    // Non-immersive browser, show notice
    const vrNotice = document.querySelector(".vr-notice");
    vrNotice.setAttribute("visible", true);
    vrNotice.setAttribute("follow-in-fov", {
      angle: isLower ? 39 : -15
    });
  }
}

export function handleReEntryToVRFrom2DInterstitial() {
  if (!isIn2DInterstitial) return;
  isIn2DInterstitial = false;

  document.querySelector(".vr-notice").setAttribute("visible", false);

  if (detectInHMD()) {
    const scene = document.querySelector("a-scene");
    scene.enterVR();
  }
}
