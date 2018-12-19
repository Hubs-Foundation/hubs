import { addMedia } from "../utils/media-utils";
import { ObjectContentOrigins } from "../object-types";

AFRAME.registerComponent("clone-media-button", {
  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });

    this.onClick = () => {
      const { src, resize } = this.targetEl.components["media-loader"].data;
      const { entity } = addMedia(src, "#interactable-media", ObjectContentOrigins.URL, true, resize);
      entity.object3D.position.copy(this.targetEl.object3D.position);
      entity.object3D.rotation.copy(this.targetEl.object3D.rotation);
      entity.object3D.scale.copy(this.targetEl.object3D.scale);
      entity.object3D.matrixNeedsUpdate = true;
      entity.object3D.matrixWorldNeedsUpdate = true;
    };
  },

  play() {
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onClick);
  }
});
