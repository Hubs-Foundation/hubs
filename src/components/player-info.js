import { injectCustomShaderChunks } from "../utils/media-utils";
import { AVATAR_TYPES } from "../assets/avatars/avatars";
/**
 * Sets player info state, including avatar choice and display name.
 * @namespace avatar
 * @component player-info
 */
AFRAME.registerComponent("player-info", {
  schema: {
    displayName: { type: "string" },
    avatarSrc: { type: "string" },
    avatarType: { type: "string", default: AVATAR_TYPES.LEGACY }
  },
  init() {
    this.applyProperties = this.applyProperties.bind(this);
  },
  play() {
    this.el.addEventListener("model-loaded", this.applyProperties);
  },
  pause() {
    this.el.removeEventListener("model-loaded", this.applyProperties);
  },
  update() {
    this.applyProperties();
  },
  applyProperties() {
    const nametagEl = this.el.querySelector(".nametag");
    if (this.data.displayName && nametagEl) {
      nametagEl.setAttribute("text", {
        value: this.data.displayName
      });
    }

    const modelEl = this.el.querySelector(".model");
    if (this.data.avatarSrc && modelEl) {
      modelEl.setAttribute("gltf-model-plus", "src", this.data.avatarSrc);
      this.el.sceneEl.systems["camera-tools"].avatarUpdated();
    }

    const uniforms = injectCustomShaderChunks(this.el.object3D);
    this.el.querySelectorAll("[hover-visuals]").forEach(el => {
      el.components["hover-visuals"].uniforms = uniforms;
    });
  }
});
