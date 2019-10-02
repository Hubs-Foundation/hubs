import { injectCustomShaderChunks } from "../utils/media-utils";
import { AVATAR_TYPES } from "../utils/avatar-utils";
import { registerComponentInstance } from "../utils/component-utils";
import { deregisterComponentInstance } from "../utils/component-utils";

import happyEmoji from "../assets/images/chest-emojis/screen-effect/happy.png";
import sadEmoji from "../assets/images/chest-emojis/screen-effect/sad.png";
import angryEmoji from "../assets/images/chest-emojis/screen-effect/angry.png";
import ewwEmoji from "../assets/images/chest-emojis/screen-effect/eww.png";
import disgustEmoji from "../assets/images/chest-emojis/screen-effect/disgust.png";
import heartsEmoji from "../assets/images/chest-emojis/screen-effect/hearts.png";
import smileEmoji from "../assets/images/chest-emojis/screen-effect/smile.png";
import surpriseEmoji from "../assets/images/chest-emojis/screen-effect/surprise.png";

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
const emojiTypeToImage = {
  happy: happyEmoji,
  sad: sadEmoji,
  angry: angryEmoji,
  smile: smileEmoji,
  surprise: surpriseEmoji,
  eww: ewwEmoji,
  hearts: heartsEmoji,
  disgust: disgustEmoji
};
/**
 * Sets player info state, including avatar choice and display name.
 * @namespace avatar
 * @component player-info
 */
AFRAME.registerComponent("player-info", {
  schema: {
    avatarSrc: { type: "string" },
    avatarType: { type: "string", default: AVATAR_TYPES.SKINNABLE },
    emojiType: { type: "string", default: null }
  },
  init() {
    this.displayName = null;
    this.communityIdentifier = null;
    this.isOwner = false;
    this.isRecording = false;
    this.applyProperties = this.applyProperties.bind(this);
    this.updateDisplayName = this.updateDisplayName.bind(this);
    this.applyDisplayName = this.applyDisplayName.bind(this);
    this.handleModelError = this.handleModelError.bind(this);

    this.isLocalPlayerInfo = this.el.id === "avatar-rig";
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
    this.el.sceneEl.addEventListener("change_emoji", this.changeEmoji);
    this.el.addEventListener("model-loaded", this.applyProperties);
    this.el.sceneEl.addEventListener("presence_updated", this.updateDisplayName);
    if (this.isLocalPlayerInfo) {
      this.el.querySelector(".model").addEventListener("model-error", this.handleModelError);
    }
  },
  pause() {
    this.el.sceneEl.removeEventListener("change_emoji", this.changeEmoji);
    this.el.removeEventListener("model-loaded", this.applyProperties);
    this.el.sceneEl.removeEventListener("presence_updated", this.updateDisplayName);
    if (this.isLocalPlayerInfo) {
      this.el.querySelector(".model").removeEventListener("model-error", this.handleModelError);
    }
  },

  applyEmoji() {
    const avatarImage = this.el.querySelector(".chest-image");
    if (!avatarImage) return;
    const emojiType = this.data.emojiType;
    const emojiImage = emojiTypeToImage[emojiType];
    if (emojiType === "empty") {
      avatarImage.removeAttribute("media-image");
      avatarImage.removeAttribute("media-loader");
      avatarImage.removeObject3D("mesh");
    } else if (emojiType !== null) {
      avatarImage.setAttribute("media-loader", {
        playSoundEffect: this.isLocalPlayerInfo,
        src: new URL(emojiImage, window.location.href).href
      });
    }
    if (this.isLocalPlayerInfo) {
      this.el.emit("emoji_changed", { emojiType }, false);
    }
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
    }

    const uniforms = injectCustomShaderChunks(this.el.object3D);
    this.el.querySelectorAll("[hover-visuals]").forEach(el => {
      el.components["hover-visuals"].uniforms = uniforms;
    });
    this.applyEmoji();
  },
  handleModelError() {
    window.APP.store.resetToRandomDefaultAvatar();
  }
});
