import { injectCustomShaderChunks } from "../utils/media-utils";
import { AVATAR_TYPES } from "../utils/avatar-utils";
import { registerComponentInstance, deregisterComponentInstance } from "../utils/component-utils";
import defaultAvatar from "../assets/models/DefaultAvatar.glb";
import { MediaDevicesEvents } from "../utils/media-devices-utils";
import anime from "animejs";
import MovingAverage from "moving-average";
import { getThemeColor } from "../utils/theme";

const NAMETAG_BACKGROUND_PADDING = 0.05;
const NAMETAG_STATUS_BORDER_PADDING = 0.035;
const NAMETAG_FADE_OUT_DELAY = 1000;
const NAMETAG_MIN_WIDTH = 0.6;

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

async function animComp(el, component, props, { onComplete, showOnStart, hideOnEnd } = {}) {
  const cmp = el.components[component];
  if (!el || !cmp) return;
  const config = Object.assign({}, ANIM_CONFIG, props, {
    targets: el.components[component].data,
    begin: () => {
      if (showOnStart !== undefined) el.setAttribute("visible", showOnStart);
    },
    update: anim => {
      el.setAttribute(component, anim.animatables[0].target);
    },
    complete: anim => {
      el.setAttribute(component, anim.animatables[0].target);
      if (hideOnEnd !== undefined) el.setAttribute("visible", !hideOnEnd);
      onComplete && onComplete();
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
    this.isFirstNametagPass = true;
    this.lastNametagState = {};
    this.nametagState = {};
    this.volumeAvg = new MovingAverage(128);
    this.lastVolumeUpdate = Date.now();
    this.isNametagVisible = false;
    this.applyProperties = this.applyProperties.bind(this);
    this.updateDisplayName = this.updateDisplayName.bind(this);
    this.applyDisplayName = this.applyDisplayName.bind(this);
    this.handleModelError = this.handleModelError.bind(this);
    this.handleRemoteModelError = this.handleRemoteModelError.bind(this);
    this.update = this.update.bind(this);
    this.onMicStateChanged = this.onMicStateChanged.bind(this);
    this.onAnalyserVolumeUpdated = this.onAnalyserVolumeUpdated.bind(this);

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
    const isRecording = !!(presenceMeta.streaming || presenceMeta.recording);
    const isOwner = !!(presenceMeta.roles && presenceMeta.roles.owner);
    const isHandRaised = presenceMeta.handRaised;
    const isTyping = presenceMeta.typing;
    this.updateNameTagState({ isOwner, isRecording, isHandRaised, isTyping });
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
      const freezeModeVisible =
        store.state.preferences.onlyShowNametagsInFreeze === true && this.el.sceneEl.is("frozen");
      this.isNametagVisible = this.isNametagVisible && freezeModeVisible;
    } else if (nametagVisibility === "showAll") {
      this.isNametagVisible = true;
    }

    const nametagEl = this.el.querySelector(".nametag");
    if (this.displayName && nametagEl) {
      const text = this.el.querySelector("[text]");
      text.addEventListener("text-updated", () => this.onNameTagUpdated(true), { once: true });
      text.setAttribute("text", { value: this.displayName + (this.identityName ? ` (${this.identityName})` : "") });
      nametagEl.object3D.visible = this.isNametagVisible;
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
    let isTalking = false;
    this.volumeUpdate = Date.now();
    this.volumeAvg.push(this.volumeUpdate, volume);
    if (!this.data.muted) {
      const average = this.volumeAvg.movingAverage();
      isTalking = average > 0.01;
    }
    if (isTalking) {
      this.updateNameTagState({ isTalking });
    } else {
      if (this.volumeUpdate - this.lastVolumeUpdate > 2000) {
        this.lastVolumeUpdate = this.volumeUpdate;
        this.updateNameTagState({ isTalking });
      }
    }
  },

  updateNameTagState(newState) {
    Object.assign(this.lastNametagState, this.nametagState);
    Object.assign(this.nametagState, newState);
    if (this.hasStatusChanged()) {
      this.onNameTagUpdated();
    }
  },

  hasStatusChanged(props) {
    if (props) {
      return props.some(prop => this.nametagState[prop] !== this.lastNametagState[prop]);
    } else {
      return JSON.stringify(this.nametagState) !== JSON.stringify(this.lastNametagState);
    }
  },

  isStatusExpanded() {
    return this.nametagState.isTalking || this.nametagState.isTyping;
  },

  isBadgeExpanded() {
    return this.nametagState.isOwner || this.nametagState.isRecording;
  },

  updateNametag(size, { onComplete, hideOnEnd } = {}) {
    let height = 0.2;
    if (this.statusExpanded) height += 0.2;
    if (this.badgeExpanded) height += 0.15;
    animComp(this.nametagBackgroundEl, "slice9", {
      width: size.x + NAMETAG_BACKGROUND_PADDING * 2,
      height
    });
    animComp(
      this.nametagStatusBorder,
      "slice9",
      {
        width: size.x + NAMETAG_BACKGROUND_PADDING * 2 + NAMETAG_STATUS_BORDER_PADDING,
        height: height + NAMETAG_STATUS_BORDER_PADDING
      },
      { showOnStart: this.statusExpanded, hideOnEnd, onComplete }
    );
  },

  updateName() {
    let height = 0;
    if (this.statusExpanded && !this.badgeExpanded) height = 0.1;
    if (!this.statusExpanded && this.badgeExpanded) height = -0.065;
    if (this.statusExpanded && this.badgeExpanded) height = 0.035;
    animComp(this.nametagTextEl, "position", { y: height });
  },

  updateStatusIcons({ hideOnEnd } = {}) {
    let height = -0.075;
    if (this.badgeExpanded) height = -0.15;
    animComp(this.nametagVolumeEl, "position", { x: this.nametagState.isTyping ? -0.15 : 0, y: height });
    animComp(this.nametagVolumeEl, "scale", { y: 0.15 }, { showOnStart: this.nametagState.isTalking, hideOnEnd });
    animComp(this.typingEl, "position", { x: this.nametagState.isTalking ? 0.15 : 0, y: height });
    animComp(this.typingEl, "scale", { y: 0.3 }, { showOnStart: this.nametagState.isTyping, hideOnEnd });
  },

  updateBadgeIcons() {
    let height = 0.075;
    if (this.statusExpanded) height += 0.1;
    animComp(this.recordingBadgeEl, "position", { y: height });
    animComp(this.recordingBadgeEl, "scale", { y: 0.1 }, { showOnStart: this.nametagState.isRecording });
    animComp(this.modBadgeEl, "position", { y: height });
    animComp(
      this.modBadgeEl,
      "scale",
      { y: 0.1 },
      { showOnStart: this.nametagState.isOwner && !this.nametagState.isRecording }
    );
  },

  onNameTagUpdated(force = false) {
    if (!this.isNametagVisible) return;
    this.nametagBackgroundEl = this.el.querySelector(".nametag-background-id");
    this.statusExpanded = this.isStatusExpanded();
    if (this.nametagBackgroundEl) {
      this.nametagTextEl = this.el.querySelector(".nametag-text-id");
      const size = this.nametagTextEl.components["text"]?.getSize();
      if (!size) return;
      size.x = Math.max(size.x, NAMETAG_MIN_WIDTH);
      this.nametagStatusBorder = this.el.querySelector(".nametag-status-border-id");
      this.nametagVolumeEl = this.el.querySelector(".nametag-volume-id");
      this.typingEl = this.el.querySelector(".typing-id");
      this.recordingBadgeEl = this.el.querySelector(".recordingBadge");
      this.modBadgeEl = this.el.querySelector(".modBadge");

      this.badgeExpanded = this.isBadgeExpanded();
      const badgeUpdated = this.hasStatusChanged(["isOwner", "isRecording"]);
      const refreshBadge = this.badgeExpanded && badgeUpdated;
      const statusUpdated = this.hasStatusChanged(["isTalking", "isTyping"]);
      const refreshStatus = this.statusExpanded && statusUpdated;
      if (this.statusExpanded || refreshBadge || this.isFirstNametagPass || force) {
        if (refreshStatus || refreshBadge) {
          console.log("XXX: IN");
          clearTimeout(this.expandHandle);
          this.expandHandle = null;
          this.isNametagExpanded = true;
          this.updateNametag(size);
          this.updateName();
          this.updateStatusIcons();
          this.updateBadgeIcons();
        }
      } else {
        this.expandHandle = setTimeout(() => {
          if (this.isNametagExpanded) {
            console.log("XXX: OUT");
            this.updateName();
            this.updateStatusIcons({ hideOnEnd: true });
            this.updateBadgeIcons();
            this.updateNametag(size, {
              onComplete: () => {
                this.isNametagExpanded = false;
              },
              hideOnEnd: !this.nametagState.isHandRaised
            });
          }
        }, NAMETAG_FADE_OUT_DELAY);
      }
      this.isFirstNametagPass = false;
    }
    const handRaisedId = this.el.querySelector(".hand-raised-id");
    if (handRaisedId) {
      if (this.nametagState.isHandRaised) {
        this.nametagStatusBorder.setAttribute("visible", true);
        this.nametagStatusBorder.setAttribute(
          "text-button",
          `backgroundColor: ${getThemeColor("nametag-border-color-raised-hand")}`
        );
        animComp(handRaisedId, "scale", { x: 0.2, y: 0.2, z: 0.2 }, { showOnStart: true });
      } else {
        this.nametagStatusBorder.setAttribute("visible", this.isNametagExpanded === true);
        this.nametagStatusBorder.setAttribute(
          "text-button",
          `backgroundColor: ${getThemeColor("nametag-border-color")}`
        );
        animComp(handRaisedId, "scale", { x: 0, y: 0, z: 0 }, { hideOnEnd: true });
      }
    }
  }
});
