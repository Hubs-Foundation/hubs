import { CAMERA_MODE_INSPECT } from "./camera-system.js";

export class ScenePreviewCameraSystem {
  constructor() {
    this.entities = [];
  }

  register(el) {
    this.entities.push(el);
  }

  unregister(el) {
    this.entities.splice(this.entities.indexOf(el, 1));
  }

  tick() {
    for (const el of this.entities) {
      const hubsSystems = AFRAME.scenes[0].systems["hubs-systems"];
      if (el && (!hubsSystems || hubsSystems.cameraSystem.mode !== CAMERA_MODE_INSPECT)) {
        el.components["scene-preview-camera"].tick2();
      }
    }
  }
}
