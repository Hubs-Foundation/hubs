import { willRequireUserGesture, showFullScreenIfAvailable } from "./fullscreen";
import screenfull from "screenfull";

let _isIn2DInterstitial = false;
let _exitAction = null;

const isThisMobileVR = AFRAME.utils.device.isMobileVR();

const getUserGesture = () => {
  return new Promise(resolve => {
    const scene = document.querySelector("a-scene");
    scene.addEventListener("2d-interstitial-gesture-complete", resolve, { once: true });
    scene.emit("2d-interstitial-gesture-required");
  });
};

export async function handleExitTo2DInterstitial(isLower, exitAction, nonFullscreen) {
  const scene = document.querySelector("a-scene");
  if (!scene.is("vr-mode")) {
    if (isThisMobileVR && willRequireUserGesture()) {
      await getUserGesture();
      await showFullScreenIfAvailable();
    }

    return;
  }

  _isIn2DInterstitial = true;
  _exitAction = exitAction;

  if (isThisMobileVR) {
    await scene.exitVR();

    if (!nonFullscreen) {
      await getUserGesture();
      await showFullScreenIfAvailable();
    }
  } else {
    // Non-immersive browser, show notice
    const vrNotice = document.querySelector(".vr-notice");
    vrNotice.object3D.visible = true;
    vrNotice.setAttribute("follow-in-fov", {
      angle: isLower ? 39 : -15
    });
  }
}

export async function exit2DInterstitialAndEnterVR(force) {
  if (!force && !_isIn2DInterstitial) {
    return;
  }

  _isIn2DInterstitial = false;

  document.querySelector(".vr-notice").object3D.visible = false;

  const scene = document.querySelector("a-scene");

  if (isThisMobileVR) {
    if (screenfull.isFullscreen) {
      await screenfull.exit();
      await getUserGesture();
      await scene.enterVR();
    } else {
      await scene.enterVR();
    }
  } else {
    if (!scene.is("vr-mode")) {
      await scene.enterVR();
    }
  }
}

export function isIn2DInterstitial() {
  return _isIn2DInterstitial;
}

export async function forceExitFrom2DInterstitial() {
  if (!_isIn2DInterstitial) return;

  if (_exitAction) {
    _exitAction();
    _exitAction = null;
  }

  await exit2DInterstitialAndEnterVR();
}
