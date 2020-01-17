import { cloneMedia } from "../utils/media-utils";
import { closeExistingMediaMirror } from "./close-mirrored-media-button";

AFRAME.registerComponent("mirror-media-button", {
  init() {
    this.updateSrc = () => {
      if (!this.targetEl.parentNode) return; // If removed
      this.src = this.targetEl.components["media-loader"].data.src;
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
      this.targetEl.addEventListener("media_resolved", this.updateSrc, { once: true });
      this.updateSrc();
    });

    this.onClick = () => {
      const mirrorTarget = document.querySelector("#media-mirror-target");

      closeExistingMediaMirror();

      const { entity } = cloneMedia(this.targetEl, "#linked-media", this.src, false, mirrorTarget);

      entity.object3D.scale.set(0.75, 0.75, 0.75);
      entity.object3D.matrixNeedsUpdate = true;

      mirrorTarget.parentEl.object3D.visible = true;

      entity.addEventListener(
        "media-loaded",
        () => this.el.sceneEl.systems["linked-media"].registerLinkage(this.targetEl, entity),
        { once: true }
      );
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
