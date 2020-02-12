import { closeExistingMediaMirror } from "../utils/media-utils";

AFRAME.registerComponent("close-mirrored-media-button", {
  init() {
    this.onClick = async () => {
      this.el.object3D.visible = false; // Hide button immediately on click
      await closeExistingMediaMirror();
      this.el.object3D.visible = true;
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
