import { ScenePreviewCameraSystem } from "./scene-preview-camera-system";
import { ShadowSystem } from "./shadow-system";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { AnimationMixerSystem } from "../components/animation-mixer";

AFRAME.registerSystem("scene-systems", {
  init() {
    waitForDOMContentLoaded().then(() => {
      this.DOMContentDidLoad = true;
    });
    this.scenePreviewCameraSystem = new ScenePreviewCameraSystem();
    this.animationMixerSystem = new AnimationMixerSystem();
    this.shadowSystem = new ShadowSystem(this.el);
  },

  tick(t, dt) {
    if (!this.DOMContentDidLoad) return;
    this.animationMixerSystem.tick(dt);
    this.scenePreviewCameraSystem.tick();
    this.shadowSystem.tick();
  }
});
