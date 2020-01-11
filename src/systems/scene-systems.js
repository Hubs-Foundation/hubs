import { LobbyCameraSystem } from "./lobby-camera-system";
import { waitForDOMContentLoaded } from "../utils/async-utils";

AFRAME.registerSystem("scene-systems", {
  init() {
    waitForDOMContentLoaded().then(() => {
      this.DOMContentDidLoad = true;
    });
    this.lobbyCameraSystem = new LobbyCameraSystem();
  },

  tick() {
    if (!this.DOMContentDidLoad) return;
    this.lobbyCameraSystem.tick();
  }
});
