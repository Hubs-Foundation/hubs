import { cloneMedia } from "../utils/media-utils";
import { closeExistingMediaMirror } from "../utils/media-utils";

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

    this.onClick = async () => {
      const mirrorTarget = document.querySelector("#media-mirror-target");

      await closeExistingMediaMirror();

      const { entity } = cloneMedia(this.targetEl, "#linked-media", this.src, false, true, mirrorTarget);

      entity.object3D.scale.set(0.75, 0.75, 0.75);
      entity.object3D.matrixNeedsUpdate = true;

      mirrorTarget.parentEl.components["follow-in-fov"].reset();
      mirrorTarget.parentEl.object3D.visible = true;
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
