import { injectCustomShaderChunks } from "../utils/media-utils";
import { AVATAR_TYPES } from "../utils/avatar-utils";
import { registerComponentInstance } from "../utils/component-utils";
import { deregisterComponentInstance } from "../utils/component-utils";

import happyEmoji from "../assets/images/sprites/chest-emojis/screen effect/happy.png";
import sadEmoji from "../assets/images/sprites/chest-emojis/screen effect/sad.png";
import angryEmoji from "../assets/images/sprites/chest-emojis/screen effect/angry.png";
import ewwEmoji from "../assets/images/sprites/chest-emojis/screen effect/eww.png";
import disgustEmoji from "../assets/images/sprites/chest-emojis/screen effect/disgust.png";
import heartsEmoji from "../assets/images/sprites/chest-emojis/screen effect/hearts.png";
import smileEmoji from "../assets/images/sprites/chest-emojis/screen effect/smile.png";
import surpriseEmoji from "../assets/images/sprites/chest-emojis/screen effect/surprise.png";
import emptyEmoji from "../assets/images/sprites/chest-emojis/screen effect/empty.png";
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
    avatarType: { type: "string", default: AVATAR_TYPES.LEGACY }
  },
  init() {
    this.changeHappyEmoji = this.changeHappyEmoji.bind(this);
    this.changeSadEmoji = this.changeSadEmoji.bind(this);
    this.changeAngryEmoji = this.changeAngryEmoji.bind(this);
    this.changeSmileEmoji = this.changeSmileEmoji.bind(this);
    this.changeSurpriseEmoji = this.changeSurpriseEmoji.bind(this);
    this.changeEwwEmoji = this.changeEwwEmoji.bind(this);
    this.changeHeartsEmoji = this.changeHeartsEmoji.bind(this);
    this.cleanEmoji = this.cleanEmoji.bind(this);
    this.changeDisgustEmoji = this.changeDisgustEmoji.bind(this);
    this.displayName = null;
    this.communityIdentifier = null;
    this.isOwner = false;
    this.isRecording = false;
    this.applyProperties = this.applyProperties.bind(this);
    this.updateDisplayName = this.updateDisplayName.bind(this);
    this.applyDisplayName = this.applyDisplayName.bind(this);
    this.handleModelError = this.handleModelError.bind(this);

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
    registerComponentInstance(this, "player-info");
  },
  remove() {
    deregisterComponentInstance(this, "player-info");
  },
  play() {
    ["happy", "sad", "eww", "disgust", "angry", "smile", "hearts", "surprise", "clean"].map(x =>
      this.el.sceneEl.addEventListener(x, this.emojiAction(x))
    );
    this.el.addEventListener("model-loaded", this.applyProperties);
    this.el.sceneEl.addEventListener("presence_updated", this.updateDisplayName);
    if (this.isLocalPlayerInfo) {
      this.el.querySelector(".model").addEventListener("model-error", this.handleModelError);
    }
  },
  pause() {
    ["happy", "sad", "eww", "disgust", "angry", "smile", "hearts", "surprise", "clean"].map(x =>
      this.el.sceneEl.removeEventListener(x, this.emojiAction(x))
    );
    this.el.removeEventListener("model-loaded", this.applyProperties);
    this.el.sceneEl.removeEventListener("presence_updated", this.updateDisplayName);
    if (this.isLocalPlayerInfo) {
      this.el.querySelector(".model").removeEventListener("model-error", this.handleModelError);
    }
  },

  emojiAction(type) {
    switch (type) {
      case "happy":
        return this.changeHappyEmoji;
      case "sad":
        return this.changeSadEmoji;
      case "eww":
        return this.changeEwwEmoji;
      case "disgust":
        return this.changeDisgustEmoji;
      case "angry":
        return this.changeAngryEmoji;
      case "smile":
        return this.changeSmileEmoji;
      case "hearts":
        return this.changeHeartsEmoji;
      case "surprise":
        return this.changeSurpriseEmoji;
      case "clean":
        return this.cleanEmoji;
    }
  },

  changeHappyEmoji() {
    console.log("change emoji called");

    this.el.sceneEl
      .querySelector("#player-rig")
      .querySelector(".image")
      .setAttribute("media-loader", { src: new URL(happyEmoji, window.location.href).href });

    console.log("change emoji called");
  },
  changeSadEmoji() {
    //console.log("change emoji called");

    this.el.sceneEl
      .querySelector("#player-rig")
      .querySelector(".image")
      .setAttribute("media-loader", { src: new URL(sadEmoji, window.location.href).href });

    console.log("change emoji called");
  },
  changeAngryEmoji() {
    this.el.sceneEl
      .querySelector("#player-rig")
      .querySelector(".image")
      .setAttribute("media-loader", { src: new URL(angryEmoji, window.location.href).href });
  },
  changeEwwEmoji() {
    console.log("change emoji called");

    this.el.sceneEl
      .querySelector("#player-rig")
      .querySelector(".image")
      .setAttribute("media-loader", { src: new URL(ewwEmoji, window.location.href).href });

    console.log("change emoji called");
  },
  changeDisgustEmoji() {
    console.log("change emoji called");

    this.el.sceneEl
      .querySelector("#player-rig")
      .querySelector(".image")
      .setAttribute("media-loader", { src: new URL(disgustEmoji, window.location.href).href });

    console.log("change emoji called");
  },
  changeHeartsEmoji() {
    console.log("change emoji called");

    this.el.sceneEl
      .querySelector("#player-rig")
      .querySelector(".image")
      .setAttribute("media-loader", { src: new URL(heartsEmoji, window.location.href).href });

    console.log("change emoji called");
  },
  changeSmileEmoji() {
    console.log("change emoji called");

    this.el.sceneEl
      .querySelector("#player-rig")
      .querySelector(".image")
      .setAttribute("media-loader", { src: new URL(smileEmoji, window.location.href).href });

    console.log("change emoji called");
  },
  changeSurpriseEmoji() {
    console.log("change emoji called");

    this.el.sceneEl
      .querySelector("#player-rig")
      .querySelector(".image")
      .setAttribute("media-loader", { src: new URL(surpriseEmoji, window.location.href).href });

    console.log("change emoji called");
  },
  cleanEmoji() {
    this.el.sceneEl
      .querySelector("#player-rig")
      .querySelector(".image")
      .setAttribute("media-loader", { src: new URL(emptyEmoji, window.location.href).href });

    console.log("emptied chest screen");
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
    this.displayName = presenceMeta.profile.displayName;
    this.communityIdentifier = presenceMeta.profile.communityIdentifier;
    this.isRecording = !!(presenceMeta.streaming || presenceMeta.recording);
    this.isOwner = !!(presenceMeta.roles && presenceMeta.roles.owner);
    this.applyDisplayName();
  },
  applyDisplayName() {
    const nametagEl = this.el.querySelector(".nametag");
    if (this.displayName && nametagEl) {
      nametagEl.setAttribute("text", { value: this.displayName });
    }
    const communityIdentifierEl = this.el.querySelector(".communityIdentifier");
    if (communityIdentifierEl) {
      if (this.communityIdentifier) {
        communityIdentifierEl.setAttribute("text", { value: this.communityIdentifier });
      }
    }
    const recordingBadgeEl = this.el.querySelector(".recordingBadge");
    if (recordingBadgeEl) {
      recordingBadgeEl.object3D.visible = this.isRecording;
    }

    const modBadgeEl = this.el.querySelector(".modBadge");
    if (modBadgeEl) {
      modBadgeEl.object3D.visible = !this.isRecording && this.isOwner;
    }
  },
  applyProperties() {
    this.applyDisplayName();

    const modelEl = this.el.querySelector(".model");
    if (this.data.avatarSrc && modelEl) {
      modelEl.components["gltf-model-plus"].jsonPreprocessor = ensureAvatarNodes;
      modelEl.setAttribute("gltf-model-plus", "src", this.data.avatarSrc);
      this.el.sceneEl.systems["camera-tools"].avatarUpdated();
    }

    const uniforms = injectCustomShaderChunks(this.el.object3D);
    this.el.querySelectorAll("[hover-visuals]").forEach(el => {
      el.components["hover-visuals"].uniforms = uniforms;
    });
  },
  handleModelError() {
    window.APP.store.resetToRandomLegacyAvatar();
  }
});
