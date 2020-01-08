import { CAMERA_MODE_INSPECT } from "./camera-system.js";

export class LobbyCameraSystem {
  tick() {
    const el = document.querySelector("[scene-preview-camera]");
    const hubsSystems = AFRAME.scenes[0].systems["hubs-systems"];
    if (el && (!hubsSystems || hubsSystems.cameraSystem.mode !== CAMERA_MODE_INSPECT)) {
      el.components["scene-preview-camera"].tick2();
    }
  }
}
