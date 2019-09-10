import { CAMERA_MODE_INSPECT } from "./camera-system.js";

export class LobbyCameraSystem {
  tick() {
    const el = document.querySelector("[scene-preview-camera]");
    if (el && AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.mode !== CAMERA_MODE_INSPECT) {
      el.components["scene-preview-camera"].tick2();
    }
  }
}
