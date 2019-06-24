import { willRequireUserGesture, showFullScreenIfAvailable } from "./fullscreen";
import screenfull from "screenfull";

let _isIn2DInterstitial = false;
let _exitAction = null;

const isMobileVR = AFRAME.utils.device.isMobileVR();

const afterUserGesturePrompt = f => {
  const scene = document.querySelector("a-scene");
  scene.addEventListener("2d-interstitial-gesture-complete", f, { once: true });
  scene.emit("2d-interstitial-gesture-required");
};

export function handleExitTo2DInterstitial(isLower, exitAction) {
  const scene = document.querySelector("a-scene");
  if (!scene.is("vr-mode")) {
    if (isMobileVR && willRequireUserGesture()) {
      afterUserGesturePrompt(() => {
        showFullScreenIfAvailable();
      });
    }

    return;
  }

  _isIn2DInterstitial = true;
  _exitAction = exitAction;

  if (isMobileVR) {
    // Immersive browser, exit VR.
    scene.exitVR().then(() => {
      afterUserGesturePrompt(() => {
        showFullScreenIfAvailable();
      });
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

export function exit2DInterstitialAndEnterVR(force) {
  if (!force && !_isIn2DInterstitial) {
    return;
  }

  _isIn2DInterstitial = false;

  document.querySelector(".vr-notice").object3D.visible = false;

  const scene = document.querySelector("a-scene");

  if (isMobileVR) {
    if (screenfull.isFullscreen) {
      screenfull.exit();
      afterUserGesturePrompt(() => scene.enterVR());
    } else {
      scene.enterVR();
    }
  } else {
    if (!scene.is("vr-mode")) {
      scene.enterVR();
    }
  }
}

export function isIn2DInterstitial() {
  return _isIn2DInterstitial;
}

export function forceExitFrom2DInterstitial() {
  if (!_isIn2DInterstitial) return;

  if (_exitAction) {
    _exitAction();
    _exitAction = null;
  }

  exit2DInterstitialAndEnterVR();
}
