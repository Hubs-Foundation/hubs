import { injectCustomShaderChunks } from "../utils/media-utils";
import { AVATAR_TYPES } from "../utils/avatar-utils";
import { registerComponentInstance, deregisterComponentInstance } from "../utils/component-utils";
import defaultAvatar from "../assets/models/DefaultAvatar.glb";
import { MediaDevicesEvents } from "../utils/media-devices-utils";
import anime from "animejs";

const NAMETAG_BACKGROUND_PADDING = 0.05;
const NAMETAG_STATUS_BORDER_PADDING = 0.035;

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

const ANIM_CONFIG = {
  duration: 400,
  easing: "easeOutElastic",
  elasticity: 400,
  loop: 0,
  round: false
};

function animComp(el, component, props, { showOnBegin = true, hideOnComplete = false } = {}) {
  const config = Object.assign({}, ANIM_CONFIG, props, {
    targets: el.components[component].data,
    begin: () => {
      if (showOnBegin) el.setAttribute("visible", true);
    },
    update: anim => {
      el.setAttribute(component, anim.animatables[0].target);
    },
    complete: anim => {
      el.setAttribute(component, anim.animatables[0].target);
      if (hideOnComplete) el.setAttribute("visible", false);
    }
  });
  anime(config);
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
    this.isHandRaised = false;
    this.wasHandRaised = false;
    this.isTalking = false;
    this.isNametagVisible = false;
    this.applyProperties = this.applyProperties.bind(this);
    this.updateDisplayName = this.updateDisplayName.bind(this);
    this.applyDisplayName = this.applyDisplayName.bind(this);
    this.handleModelError = this.handleModelError.bind(this);
    this.handleRemoteModelError = this.handleRemoteModelError.bind(this);
    this.update = this.update.bind(this);
    this.onMicStateChanged = this.onMicStateChanged.bind(this);
    this.onAnalyserVolumeUpdated = this.onAnalyserVolumeUpdated.bind(this);
    this.onNameTagUpdated = this.onNameTagUpdated.bind(this);

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
    this.el.sceneEl.addEventListener("presence_updated", this.update);

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
    this.el.sceneEl.removeEventListener("presence_updated", this.update);
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
    this.wasHandRaised = this.isHandRaised;
    this.isHandRaised = presenceMeta.handRaised;
    this.applyDisplayName();
  },
  can(perm) {
    return !!this.permissions && this.permissions[perm];
  },
  applyDisplayName() {
    const store = window.APP.store;

    this.isNametagVisible = !this.isLocalPlayerInfo;
    const nametagVisibility = store.state.preferences.nametagVisibility;
    if (nametagVisibility === "showNone") {
      const freezeModeVisible = store.state.preferences.onlyShowNametagsInFreeze && this.el.sceneEl.is("frozen");
      this.isNametagVisible = this.isNametagVisible && freezeModeVisible;
    } else if (nametagVisibility === "showAll") {
      this.isNametagVisible = true;
    }

    const nametagEl = this.el.querySelector(".nametag");
    if (this.displayName && nametagEl) {
      const text = this.el.querySelector("[text]");
      text.addEventListener("text-updated", this.onNameTagUpdated, { once: true });
      text.setAttribute("text", { value: this.displayName });
      nametagEl.object3D.visible = this.isNametagVisible;
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
      recordingBadgeEl.object3D.visible = this.isRecording && this.isNametagVisible;
    }

    const modBadgeEl = this.el.querySelector(".modBadge");
    if (modBadgeEl) {
      modBadgeEl.object3D.visible = !this.isRecording && this.isOwner && this.isNametagVisible;
    }

    this.onNameTagUpdated();
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
    this.wasTalking = this.isTalking;
    this.isTalking = volume > 0.01 && !this.data.muted;
    this.onNameTagUpdated();
  },

  onNameTagUpdated() {
    const nametagBackground = this.el.querySelector(".nametag-background-id");
    if (nametagBackground) {
      // Get the updated text size
      const nametagText = this.el.querySelector(".nametag-text-id");
      const size = nametagText.components["text"]?.getSize();
      const nametagStatusBorder = this.el.querySelector(".nametag-status-border-id");
      const nametagVolumeId = this.el.querySelector(".nametag-volume-id");

      if (size) {
        if (this.isTalking && !this.wasTalking) {
          clearTimeout(this.expandHandle);
          this.expandHandle = null;
          animComp(nametagBackground, "slice9", { width: size.x + NAMETAG_BACKGROUND_PADDING * 2, height: 0.5 });
          animComp(
            nametagStatusBorder,
            "slice9",
            {
              width: size.x + NAMETAG_BACKGROUND_PADDING * 2 + NAMETAG_STATUS_BORDER_PADDING,
              height: 0.5 + NAMETAG_STATUS_BORDER_PADDING
            },
            { showOnBegin: true && this.isNametagVisible }
          );
          animComp(nametagText, "position", { x: 0, y: 0.1, z: 0.001 });
          animComp(
            nametagVolumeId,
            "position",
            { x: 0, y: -0.1, z: 0.001 },
            { showOnBegin: true && this.isNametagVisible }
          );
          animComp(nametagVolumeId, "scale", { y: 0.15 });
        } else if (this.wasTalking && !this.isTalking) {
          if (!this.expandHandle) {
            this.expandHandle = setTimeout(() => {
              animComp(nametagBackground, "slice9", { width: size.x + NAMETAG_BACKGROUND_PADDING * 2, height: 0.2 });
              animComp(
                nametagStatusBorder,
                "slice9",
                {
                  width: size.x + NAMETAG_BACKGROUND_PADDING * 2 + NAMETAG_STATUS_BORDER_PADDING,
                  height: 0.2 + NAMETAG_STATUS_BORDER_PADDING
                },
                { hideOnComplete: true }
              );
              animComp(nametagText, "position", { x: 0, y: 0, z: 0.001 });
              animComp(nametagVolumeId, "position", { x: 0, y: 0, z: 0 });
              animComp(nametagVolumeId, "scale", { y: 0 }, { hideOnComplete: true });
            }, 1000);
          }
        }
      }
    }
    const handRaisedId = this.el.querySelector(".hand-raised-id");
    const handRaisedScale = handRaisedId?.components["scale"];
    if (handRaisedId && handRaisedScale) {
      if (this.isHandRaised && !this.wasHandRaised) {
        animComp(handRaisedId, "scale", { x: 0.2, y: 0.2, z: 0.2 });
      } else if (this.wasHandRaised && !this.isHandRaised) {
        animComp(handRaisedId, "scale", { x: 0, y: 0, z: 0 }, { hideOnComplete: true });
      }
    }
  }
});
