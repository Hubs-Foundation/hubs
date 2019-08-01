import { addMedia } from "../utils/media-utils";
import { ObjectContentOrigins } from "../object-types";
import { guessContentType } from "../utils/media-url-utils";

AFRAME.registerComponent("clone-media-button", {
  init() {
    this.updateSrc = () => {
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
      const src = this.src;
      const { contentSubtype, resize } = this.targetEl.components["media-loader"].data;
      const { entity } = addMedia(src, "#interactable-media", ObjectContentOrigins.URL, contentSubtype, true, resize);

      entity.object3D.matrixNeedsUpdate = true;

      entity.setAttribute("offset-relative-to", {
        target: "#player-camera",
        offset: { x: 0, y: 0, z: -1.5 }
      });
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
