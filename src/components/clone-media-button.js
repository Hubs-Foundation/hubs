import { addMedia } from "../utils/media-utils";
import { ObjectContentOrigins } from "../object-types";
import { guessContentType } from "../utils/media-utils";

AFRAME.registerComponent("clone-media-button", {
  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;

      const { src } = this.targetEl.components["media-loader"].data;

      if (guessContentType(src) === "video/vnd.hubs-webrtc") {
        this.el.object3D.visible = false;
      }
    });

    this.onClick = () => {
      const { src, resize } = this.targetEl.components["media-loader"].data;
      const { entity } = addMedia(src, "#interactable-media", ObjectContentOrigins.URL, true, resize);

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
