import { ScenePreviewCameraSystem } from "./scene-preview-camera-system";
import { waitForDOMContentLoaded } from "../utils/async-utils";

AFRAME.registerSystem("scene-systems", {
  init() {
    waitForDOMContentLoaded().then(() => {
      this.DOMContentDidLoad = true;
    });
    this.scenePreviewCameraSystem = new ScenePreviewCameraSystem();
  },

  tick() {
    if (!this.DOMContentDidLoad) return;
    this.scenePreviewCameraSystem.tick();
  }
});
