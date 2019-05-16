import { injectCustomShaderChunks } from "../utils/media-utils";
import { AVATAR_TYPES } from "../utils/avatar-utils";
/**
 * Sets player info state, including avatar choice and display name.
 * @namespace avatar
 * @component player-info
 */
AFRAME.registerComponent("player-info", {
  schema: {
    avatarSrc: { type: "string" },
    avatarType: { type: "string", default: AVATAR_TYPES.LEGACY }
  },
  init() {
    this.displayName = null;
    this.applyProperties = this.applyProperties.bind(this);
    this.updateDisplayName = this.updateDisplayName.bind(this);
    this.applyDisplayName = this.applyDisplayName.bind(this);

    this.isLocalPlayerInfo = this.el.id === "player-rig";
    this.playerSessionId = null;

    if (!this.isLocalPlayerInfo) {
      NAF.utils.getNetworkedEntity(this.el).then(networkedEntity => {
        this.playerSessionId = NAF.utils.getCreator(networkedEntity);
        const playerPresence = window.APP.hubChannel.presence.state[this.playerSessionId];
        if (playerPresence) {
          this.updateDisplayNameFromPresenceMeta(playerPresence.metas[0]);
        }
      });
    }
  },
  play() {
    this.el.addEventListener("model-loaded", this.applyProperties);
    this.el.sceneEl.addEventListener("presence_updated", this.updateDisplayName);
  },
  pause() {
    this.el.removeEventListener("model-loaded", this.applyProperties);
    this.el.sceneEl.removeEventListener("presence_updated", this.updateDisplayName);
  },
  update() {
    this.applyProperties();
  },
  updateDisplayName(e) {
    if (!this.playerSessionId && this.isLocalPlayerInfo) {
      this.playerSessionId = NAF.clientId;
    }
    if (!this.playerSessionId) return;
    if (this.playerSessionId !== e.detail.sessionId) return;

    this.updateDisplayNameFromPresenceMeta(e.detail);
  },
  updateDisplayNameFromPresenceMeta(presenceMeta) {
    const isModerator = presenceMeta.roles && presenceMeta.roles.moderator;
    this.displayName = presenceMeta.profile.displayName + (isModerator ? " *" : "");
    this.applyDisplayName();
  },
  applyDisplayName() {
    const nametagEl = this.el.querySelector(".nametag");
    if (this.displayName && nametagEl) {
      nametagEl.setAttribute("text", { value: this.displayName });
    }
  },
  applyProperties() {
    this.applyDisplayName();

    const modelEl = this.el.querySelector(".model");
    if (this.data.avatarSrc && modelEl) {
      modelEl.addEventListener(
        "model-loaded",
        () => {
          this.el.sceneEl.renderer.compileAndUploadMaterials(this.el.sceneEl.object3D, this.el.sceneEl.camera, [modelEl.object3D]);
        },
        {
          once: true
        }
      );

      modelEl.setAttribute("gltf-model-plus", "src", this.data.avatarSrc);
      this.el.sceneEl.systems["camera-tools"].avatarUpdated();
    }

    const uniforms = injectCustomShaderChunks(this.el.object3D);
    this.el.querySelectorAll("[hover-visuals]").forEach(el => {
      el.components["hover-visuals"].uniforms = uniforms;
    });
  }
});
