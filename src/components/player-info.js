import { injectCustomShaderChunks } from "../utils/media-utils";
import { AVATAR_TYPES } from "../utils/avatar-utils";
import { registerComponentInstance, deregisterComponentInstance } from "../utils/component-utils";
import defaultAvatar from "../assets/models/DefaultAvatar.glb";
import { MediaDevicesEvents } from "../utils/media-devices-utils";
import anime from "animejs";

const NAMETAG_BACKGROUND_PADDING = 0.05;
const NAMETAG_STATUS_BORDER_PADDING = 0.035;

export const STATUS = Object.freeze({
  IDLE: 0,
  TALKING: 1
});

function ensureAvatarNodes(json) {
  const { nodes } = json;
  if (!nodes.some(node => node.name === "Head")) {
    // If the avatar model doesn't have a Head node. The user has probably chosen a custom GLB.
    // So, we need to construct a suitable hierarchy for avatar functionality to work.
    // We re-parent the original root node to the Head node and set the scene root to a new AvatarRoot.

    // Note: We assume that the first node in the primary scene is the one we care about.
    const originalRoot = json.scenes[json.scene].nodes[0];
    nodes.push({ name: "LeftEye", extensions: { MOZ_hubs_components: {} } });
    nodes.push({ name: "RightEye", extensions: { MOZ_hubs_components: {} } });
    nodes.push({
      name: "Head",
      children: [originalRoot, nodes.length - 1, nodes.length - 2],
      extensions: { MOZ_hubs_components: { "scale-audio-feedback": "" } }
    });
    nodes.push({ name: "Neck", children: [nodes.length - 1] });
    nodes.push({ name: "Spine", children: [nodes.length - 1] });
    nodes.push({ name: "Hips", children: [nodes.length - 1] });
    nodes.push({ name: "AvatarRoot", children: [nodes.length - 1] });
    json.scenes[json.scene].nodes[0] = nodes.length - 1;
  }
  return json;
}

/**
 * Sets player info state, including avatar choice and display name.
 * @namespace avatar
 * @component player-info
 */
AFRAME.registerComponent("player-info", {
  schema: {
    avatarSrc: { type: "string" },
    avatarType: { type: "string", default: AVATAR_TYPES.SKINNABLE },
    muted: { default: false },
    isSharingAvatarCamera: { default: false }
  },
  init() {
    this.displayName = null;
    this.identityName = null;
    this.isOwner = false;
    this.isRecording = false;
    this.applyProperties = this.applyProperties.bind(this);
    this.updateDisplayName = this.updateDisplayName.bind(this);
    this.applyDisplayName = this.applyDisplayName.bind(this);
    this.handleModelError = this.handleModelError.bind(this);
    this.handleRemoteModelError = this.handleRemoteModelError.bind(this);
    this.update = this.update.bind(this);
    this.onMicStateChanged = this.onMicStateChanged.bind(this);
    this.onAnalyserVolumeUpdated = this.onAnalyserVolumeUpdated.bind(this);
    this.onDisplayNameUpdated = this.onDisplayNameUpdated.bind(this);
    this.status = new Set();

    this.isLocalPlayerInfo = this.el.id === "avatar-rig";
    this.playerSessionId = null;

    if (!this.isLocalPlayerInfo) {
      NAF.utils.getNetworkedEntity(this.el).then(networkedEntity => {
        this.playerSessionId = NAF.utils.getCreator(networkedEntity);
        const playerPresence = window.APP.hubChannel.presence.state[this.playerSessionId];
        if (playerPresence) {
          this.updateFromPresenceMeta(playerPresence.metas[0]);
        }
      });
    }
    registerComponentInstance(this, "player-info");
  },
  remove() {
    const avatarEl = this.el.querySelector("[avatar-audio-source]");
    APP.isAudioPaused.delete(avatarEl);
    deregisterComponentInstance(this, "player-info");
  },
  play() {
    this.el.addEventListener("model-loaded", this.applyProperties);
    this.el.sceneEl.addEventListener("presence_updated", this.updateDisplayName);
    if (this.isLocalPlayerInfo) {
      this.el.querySelector(".model").addEventListener("model-error", this.handleModelError);
    } else {
      this.el.querySelector(".model").addEventListener("model-error", this.handleRemoteModelError);
    }
    window.APP.store.addEventListener("statechanged", this.update);

    this.el.sceneEl.addEventListener("stateadded", this.update);
    this.el.sceneEl.addEventListener("stateremoved", this.update);

    if (this.isLocalPlayerInfo) {
      APP.dialog.on("mic-state-changed", this.onMicStateChanged);
    } else {
      this.el.addEventListener("analyser-volume-updated", this.onAnalyserVolumeUpdated);
    }
  },
  pause() {
    this.el.removeEventListener("model-loaded", this.applyProperties);
    this.el.sceneEl.removeEventListener("presence_updated", this.updateDisplayName);
    if (this.isLocalPlayerInfo) {
      this.el.querySelector(".model").removeEventListener("model-error", this.handleModelError);
    } else {
      this.el.querySelector(".model").removeEventListener("model-error", this.handleRemoteModelError);
    }
    this.el.sceneEl.removeEventListener("stateadded", this.update);
    this.el.sceneEl.removeEventListener("stateremoved", this.update);
    window.APP.store.removeEventListener("statechanged", this.update);

    if (this.isLocalPlayerInfo) {
      APP.dialog.off("mic-state-changed", this.onMicStateChanged);
    } else {
      this.el.removeEventListener("analyser-volume-updated", this.onAnalyserVolumeUpdated);
    }
  },

  update(oldData) {
    if (this.data.muted !== oldData.muted) {
      this.el.emit("remote_mute_updated", { muted: this.data.muted });
    }
    this.applyProperties();
  },
  updateDisplayName(e) {
    if (!this.playerSessionId && this.isLocalPlayerInfo) {
      this.playerSessionId = NAF.clientId;
    }
    if (!this.playerSessionId) return;
    if (this.playerSessionId !== e.detail.sessionId) return;

    this.updateFromPresenceMeta(e.detail);
  },
  updateFromPresenceMeta(presenceMeta) {
    this.permissions = presenceMeta.permissions;
    this.displayName = presenceMeta.profile.displayName;
    this.identityName = presenceMeta.profile.identityName;
    this.isRecording = !!(presenceMeta.streaming || presenceMeta.recording);
    this.isOwner = !!(presenceMeta.roles && presenceMeta.roles.owner);
    this.applyDisplayName();
  },
  can(perm) {
    return !!this.permissions && this.permissions[perm];
  },
  applyDisplayName() {
    const store = window.APP.store;

    let isNametagVisible = !this.isLocalPlayerInfo;
    const nametagVisibility = store.state.preferences.nametagVisibility;
    if (nametagVisibility === "showNone") {
      const freezeModeVisible = store.state.preferences.onlyShowNametagsInFreeze && this.el.sceneEl.is("frozen");
      isNametagVisible &= freezeModeVisible;
    } else if (nametagVisibility === "showAll") {
      isNametagVisible &= true;
    }

    const nametagEl = this.el.querySelector(".nametag");
    if (this.displayName && nametagEl) {
      const text = this.el.querySelector("[text]");
      text.addEventListener("text-updated", this.onDisplayNameUpdated, { once: true });
      text.setAttribute("text", { value: this.displayName });
      nametagEl.object3D.visible = isNametagVisible;
      const nametagStatusBorder = this.el.querySelector(".nametag-status-border-id");
      const nametagVolumeId = this.el.querySelector(".nametag-volume-id");
      if (nametagVolumeId && nametagStatusBorder) {
        nametagVolumeId.setAttribute("visible", isNametagVisible);
        nametagStatusBorder.setAttribute("visible", isNametagVisible);
      }
    }
    const identityNameEl = this.el.querySelector(".identityName");
    if (identityNameEl) {
      if (this.identityName) {
        identityNameEl.setAttribute("text", { value: this.identityName });
        identityNameEl.object3D.visible = this.el.sceneEl.is("frozen");
      }
    }
    const recordingBadgeEl = this.el.querySelector(".recordingBadge");
    if (recordingBadgeEl) {
      recordingBadgeEl.object3D.visible = this.isRecording && isNametagVisible;
    }

    const modBadgeEl = this.el.querySelector(".modBadge");
    if (modBadgeEl) {
      modBadgeEl.object3D.visible = !this.isRecording && this.isOwner && this.isNametagVisible;
    }
  },
  applyProperties(e) {
    this.applyDisplayName();

    const modelEl = this.el.querySelector(".model");
    if (this.data.avatarSrc && modelEl) {
      modelEl.components["gltf-model-plus"].jsonPreprocessor = ensureAvatarNodes;
      modelEl.setAttribute("gltf-model-plus", "src", this.data.avatarSrc);
    }

    if (!e || e.target === modelEl) {
      const uniforms = injectCustomShaderChunks(this.el.object3D);
      this.el.querySelectorAll("[hover-visuals]").forEach(el => {
        el.components["hover-visuals"].uniforms = uniforms;
      });
    }

    const videoTextureTargets = modelEl.querySelectorAll("[video-texture-target]");

    const sessionId = this.isLocalPlayerInfo ? NAF.clientId : this.playerSessionId;

    for (const el of Array.from(videoTextureTargets)) {
      el.setAttribute("video-texture-target", {
        src: this.data.isSharingAvatarCamera ? `hubs://clients/${sessionId}/video` : ""
      });

      if (this.isLocalPlayerInfo) {
        el.setAttribute("emit-scene-event-on-remove", `event:${MediaDevicesEvents.VIDEO_SHARE_ENDED}`);
      }
    }

    const avatarEl = this.el.querySelector("[avatar-audio-source]");
    if (this.data.muted) {
      APP.isAudioPaused.add(avatarEl);
    } else {
      APP.isAudioPaused.delete(avatarEl);
    }
  },
  handleModelError() {
    window.APP.store.resetToRandomDefaultAvatar();
  },
  handleRemoteModelError() {
    this.data.avatarSrc = defaultAvatar;
    this.applyProperties();
  },
  onMicStateChanged({ enabled }) {
    this.el.setAttribute("player-info", { muted: !enabled });
  },

  onAnalyserVolumeUpdated({ detail: { volume } }) {
    const newStatus = new Set(this.status);
    if (volume < 0.01 || this.data.muted) {
      newStatus.delete(STATUS.TALKING);
    } else {
      newStatus.add(STATUS.TALKING);
    }
    this.processStatus(newStatus);
  },

  onDisplayNameUpdated() {
    this.processStatus();
  },

  processStatus(newStatus) {
    const status = newStatus || this.status;
    const nametagBackground = this.el.querySelector(".nametag-background-id");
    if (nametagBackground) {
      // Get the updated text size
      const nametagText = this.el.querySelector(".nametag-text-id");
      const size = nametagText.components["text"].getSize();
      const nametagBackgroundSlice = nametagBackground.components["slice9"];
      const nametagTextPosition = nametagText.components["position"];
      const nametagStatusBorder = this.el.querySelector(".nametag-status-border-id");
      const nametagVolumeId = this.el.querySelector(".nametag-volume-id");
      const nameTagVolumePosition = nametagVolumeId.components["position"];
      const nameTagVolumeScale = nametagVolumeId.components["scale"];

      if (status.has(STATUS.TALKING) && !this.status.has(STATUS.TALKING)) {
        clearTimeout(this.expandHandle);
        this.expandHandle = null;
        const backgroundConfig = {
          duration: 400,
          easing: "easeOutElastic",
          elasticity: 400,
          loop: 0,
          round: false,
          width: size.x + NAMETAG_BACKGROUND_PADDING * 2,
          height: 0.5,
          targets: nametagBackgroundSlice.data,
          update: anim => {
            const value = anim.animatables[0].target;
            nametagBackground.setAttribute("slice9", { width: value.width, height: value.height });
            nametagStatusBorder.setAttribute("slice9", {
              width: value.width + NAMETAG_STATUS_BORDER_PADDING,
              height: value.height + NAMETAG_STATUS_BORDER_PADDING
            });
          },
          complete: anim => {
            const value = anim.animatables[0].target;
            nametagBackground.setAttribute("slice9", { width: value.width, height: value.height });
            nametagStatusBorder.setAttribute("slice9", {
              width: value.width + NAMETAG_STATUS_BORDER_PADDING,
              height: value.height + NAMETAG_STATUS_BORDER_PADDING
            });
          }
        };
        anime(backgroundConfig);
        const nameTextconfig = {
          duration: 400,
          easing: "easeOutElastic",
          elasticity: 400,
          loop: 0,
          round: false,
          x: 0,
          y: 0.1,
          z: 0.001,
          targets: nametagTextPosition.data,
          update: anim => {
            const value = anim.animatables[0].target;
            nametagText.setAttribute("position", { x: value.x, y: value.y, z: value.z });
          },
          complete: anim => {
            const value = anim.animatables[0].target;
            nametagText.setAttribute("position", { x: value.x, y: value.y, z: value.z });
          }
        };
        anime(nameTextconfig);
        const nameTextVolPositionConfig = {
          duration: 400,
          easing: "easeOutElastic",
          elasticity: 400,
          loop: 0,
          round: false,
          x: 0,
          y: -0.1,
          z: 0.001,
          targets: nameTagVolumePosition.data,
          update: anim => {
            const value = anim.animatables[0].target;
            nametagVolumeId.setAttribute("position", { x: value.x, y: value.y, z: value.z });
          },
          complete: anim => {
            const value = anim.animatables[0].target;
            nametagVolumeId.setAttribute("position", { x: value.x, y: value.y, z: value.z });
          }
        };
        anime(nameTextVolPositionConfig);
        const nameTextVolScaleConfig = {
          duration: 400,
          easing: "easeOutElastic",
          elasticity: 400,
          loop: 0,
          round: false,
          y: 0.15,
          targets: nameTagVolumeScale.data,
          update: anim => {
            const value = anim.animatables[0].target;
            nametagVolumeId.setAttribute("scale", { x: value.x, y: value.y, z: value.z });
          },
          complete: anim => {
            const value = anim.animatables[0].target;
            nametagVolumeId.setAttribute("scale", { x: value.x, y: value.y, z: value.z });
          }
        };
        anime(nameTextVolScaleConfig);
        nametagVolumeId.setAttribute("visible", true);
        nametagStatusBorder.setAttribute("visible", true);
      } else if (status.size === 0 && this.status.size === status.size) {
        if (!this.expandHandle) {
          this.expandHandle = setTimeout(() => {
            const nameTagBackgroundSlice = nametagBackground.components["slice9"];
            const backgroundConfig = {
              duration: 400,
              easing: "easeOutElastic",
              elasticity: 400,
              loop: 0,
              round: false,
              width: size.x + NAMETAG_BACKGROUND_PADDING * 2,
              height: 0.2,
              targets: nameTagBackgroundSlice.data,
              update: anim => {
                const value = anim.animatables[0].target;
                nametagBackground.setAttribute("slice9", { width: value.width, height: value.height });
                nametagStatusBorder.setAttribute("slice9", {
                  width: value.width + NAMETAG_STATUS_BORDER_PADDING,
                  height: value.height + NAMETAG_STATUS_BORDER_PADDING
                });
              },
              complete: anim => {
                const value = anim.animatables[0].target;
                nametagBackground.setAttribute("slice9", { width: value.width, height: value.height });
                nametagStatusBorder.setAttribute("slice9", {
                  width: value.width + NAMETAG_STATUS_BORDER_PADDING,
                  height: value.height + NAMETAG_STATUS_BORDER_PADDING
                });
              }
            };
            anime(backgroundConfig);
            const nametagTextPosition = nametagText.components["position"];
            const nameTextconfig = {
              duration: 400,
              easing: "easeOutElastic",
              elasticity: 400,
              loop: 0,
              round: false,
              x: 0,
              y: 0,
              z: 0.001,
              targets: nametagTextPosition.data,
              update: anim => {
                const value = anim.animatables[0].target;
                nametagText.setAttribute("position", { x: value.x, y: value.y, z: value.z });
              },
              complete: anim => {
                const value = anim.animatables[0].target;
                nametagText.setAttribute("position", { x: value.x, y: value.y, z: value.z });
              }
            };
            anime(nameTextconfig);
            const nameTagVolumePosition = nametagVolumeId.components["position"];
            const nameTextVolPositionConfig = {
              duration: 400,
              easing: "easeOutElastic",
              elasticity: 400,
              loop: 0,
              round: false,
              x: 0,
              y: 0,
              z: 0,
              targets: nameTagVolumePosition.data,
              update: anim => {
                const value = anim.animatables[0].target;
                nametagVolumeId.setAttribute("position", { x: value.x, y: value.y, z: value.z });
              },
              complete: anim => {
                const value = anim.animatables[0].target;
                nametagVolumeId.setAttribute("position", { x: value.x, y: value.y, z: value.z });
              }
            };
            anime(nameTextVolPositionConfig);
            const nameTagVolumeScale = nametagVolumeId.components["scale"];
            const nameTextVolScaleConfig = {
              duration: 400,
              easing: "easeOutElastic",
              elasticity: 400,
              loop: 0,
              round: false,
              y: 0,
              targets: nameTagVolumeScale.data,
              update: anim => {
                const value = anim.animatables[0].target;
                nametagVolumeId.setAttribute("scale", { x: value.x, y: value.y, z: value.z });
              },
              complete: anim => {
                const value = anim.animatables[0].target;
                nametagVolumeId.setAttribute("scale", { x: value.x, y: value.y, z: value.z });
              }
            };
            anime(nameTextVolScaleConfig);
            nametagVolumeId.setAttribute("visible", false);
            nametagStatusBorder.setAttribute("visible", false);
            this.expandHandle = null;
          }, 1000);
        }
      }
    }
    this.status = new Set(newStatus);
  }
});
