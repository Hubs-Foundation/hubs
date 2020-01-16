import { cloneMedia } from "../utils/media-utils";
import { guessContentType } from "../utils/media-url-utils";

AFRAME.registerComponent("clone-media-button", {
  init() {
    this.updateSrc = () => {
      if (!this.targetEl.parentNode) return; // If removed
      const src = (this.src = this.targetEl.components["media-loader"].data.src);
      const visible = src && guessContentType(src) !== "video/vnd.hubs-webrtc";
      this.el.object3D.visible = !!visible;
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
      this.targetEl.addEventListener("media_resolved", this.updateSrc, { once: true });
      this.updateSrc();
    });

    this.onClick = () => {
      const mirrorTarget = document.querySelector("#media-mirror-target");
      const { entity } = cloneMedia(this.targetEl, "#linked-media", this.src, false);

      //entity.object3D.scale.copy(this.targetEl.object3D.scale);
      entity.object3D.scale.set(1, 1, 1); // TODO remove
      entity.object3D.matrixNeedsUpdate = true;

      /*entity.setAttribute("offset-relative-to", {
        target: "#avatar-pov-node",
        offset: { x: 0, y: 0, z: -1.5 * this.targetEl.object3D.scale.z }
      });*/

      entity.addEventListener(
        "media_resolved",
        () => {
          mirrorTarget.appendChild(entity);
          mirrorTarget.parentEl.object3D.visible = true;
          this.el.sceneEl.systems["linked-media"].registerLinkage(this.targetEl, entity);
        },
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
