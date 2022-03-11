import anime from "animejs";
import MovingAverage from "moving-average";
import { getThemeColor } from "../utils/theme";
import qsTruthy from "../utils/qs_truthy";
import { findAncestorWithComponent } from "../utils/scene-graph";
import { NAMETAG_VISIBILITY_DISTANCE_DEFAULT } from "../react-components/preferences-screen";
import { THREE } from "aframe";
import { setMatrixWorld } from "../utils/three-utils";

const DEBUG = qsTruthy("debug");
const NAMETAG_BACKGROUND_PADDING = 0.05;
const NAMETAG_STATUS_BORDER_PADDING = 0.035;
const NAMETAG_MIN_WIDTH = 0.6;
const NAMETAG_HEIGHT = 0.25;
const NAMETAG_OFFSET = 0.2;
const TYPING_ANIM_SPEED = 150;
const DISPLAY_NAME_LENGTH = 18;

const ANIM_CONFIG = {
  duration: 400,
  easing: "easeOutQuart",
  elasticity: 400,
  loop: 0,
  round: false
};

AFRAME.registerComponent("name-tag", {
  schema: {},
  init() {
    this.store = window.APP.store;
    this.displayName = null;
    this.identityName = null;
    this.isTalking = false;
    this.isTyping = false;
    this.isOwner = false;
    this.isRecording = false;
    this.isHandRaised = false;
    this.volumeAvg = new MovingAverage(128);
    this.shouldBeVisible = true;
    this.size = new THREE.Vector3();
    this.avatarAABB = new THREE.Box3();
    this.avatarAABBSize = new THREE.Vector3();
    this.avatarAABBCenter = new THREE.Vector3();
    this.nametagHeight = 0;
    this.isAvatarReady = false;
    this.lastUpdateTime = Date.now();

    this.onPresenceUpdated = this.onPresenceUpdated.bind(this);
    this.onModelLoading = this.onModelLoading.bind(this);
    this.onModelLoaded = this.onModelLoaded.bind(this);
    this.onModelIkFirstTick = this.onModelIkFirstTick.bind(this);
    this.onStateChanged = this.onStateChanged.bind(this);

    this.avatarRig = document.getElementById("avatar-rig").object3D;

    this.nametag = this.el.object3D;
    this.identityName = this.el.querySelector(".identityName").object3D;
    this.nametagBackground = this.el.querySelector(".nametag-background").object3D;
    this.nametagVolume = this.el.querySelector(".nametag-volume").object3D;
    this.nametagStatusBorder = this.el.querySelector(".nametag-status-border").object3D;
    this.recordingBadge = this.el.querySelector(".recordingBadge").object3D;
    this.modBadge = this.el.querySelector(".modBadge").object3D;
    this.handRaised = this.el.querySelector(".hand-raised-id").object3D;
    this.nametagTyping = this.el.querySelector(".nametag-typing").object3D;
    this.nametagText = this.el.querySelector(".nametag-text").object3D;

    NAF.utils.getNetworkedEntity(this.el).then(networkedEntity => {
      this.playerSessionId = NAF.utils.getCreator(networkedEntity);
      const playerPresence = window.APP.hubChannel.presence.state[this.playerSessionId];
      if (playerPresence) {
        this.updateFromPresenceMeta(playerPresence.metas[0]);
      }
    });

    if (DEBUG) {
      this.avatarBBAAHelper = new THREE.Box3Helper(this.avatarAABB, 0xffff00);
      this.el.sceneEl.object3D.add(this.avatarBBAAHelper);
    }

    this.nametagVisibility = this.store.state.preferences.nametagVisibility;
    this.nametagVisibilityDistance = Math.pow(
      this.store.state.preferences.nametagVisibilityDistance !== undefined
        ? this.store.state.preferences.nametagVisibilityDistance
        : NAMETAG_VISIBILITY_DISTANCE_DEFAULT,
      2
    );
    this.onStateChanged();
  },

  remove() {
    clearInterval(this.firstIkStepHandler);
    if (DEBUG) this.el.sceneEl.object3D.remove(this.avatarBBAAHelper);
  },

  tick: (() => {
    let typingAnimTime = 0;
    const worldPos = new THREE.Vector3();
    const avatarRigWorldPos = new THREE.Vector3();
    const mat = new THREE.Matrix4();
    return function(t) {
      if (!this.isAvatarReady) {
        this.nametag.visible = false;
        return;
      }
      this.wasTalking = this.isTalking;
      this.isTalking = this.audioAnalyzer.avatarIsTalking;
      if (this.nametagVisibility === "showClose") {
        this.avatarRig.getWorldPosition(avatarRigWorldPos);
        this.nametag.getWorldPosition(worldPos);
        this.shouldBeVisible = avatarRigWorldPos.sub(worldPos).lengthSq() < this.nametagVisibilityDistance;
      } else if (this.nametagVisibility === "showSpeaking") {
        if (!this.isTalking && this.wasTalking) {
          if (Date.now() - this.lastUpdateTime > 1000) {
            this.shouldBeVisible = false;
          }
        } else if (this.isTalking && !this.wasTalking) {
          this.lastUpdateTime = Date.now();
          this.shouldBeVisible = true;
        }
      } else if (this.nametagVisibility === "showFrozen") {
        this.shouldBeVisible = this.el.sceneEl.is("frozen");
      } else if (this.nametagVisibility === "showNone") {
        this.shouldBeVisible = false;
      } else {
        this.shouldBeVisible = true;
      }

      if (this.shouldBeVisible) {
        this.nametag.visible = true;
        if (this.isTalking !== this.wasTalking) {
          this.resizeNameTag();
        }
        if (this.isTalking) {
          this.nametagVolume.visible = this.isTalking;
          this.nametagVolume.scale.setX(this.audioAnalyzer.volume * this.size.x);
          this.nametagVolume.matrixNeedsUpdate = true;
          this.nametagTyping.visible = false;
        } else {
          if (this.isTyping) {
            this.nametagTyping.visible = true;
            typingAnimTime = t;
            this.nametagTyping.traverse(o => {
              if (o.material) {
                o.material.opacity = (Math.sin(typingAnimTime / TYPING_ANIM_SPEED) + 1) / 2;
                typingAnimTime -= TYPING_ANIM_SPEED;
              }
            });
          } else {
            this.nametagTyping.visible = false;
          }
        }
        this.nametagStatusBorder.visible = this.isTyping || this.isTalking || this.isHandRaised;
        this.recordingBadge.visible = this.isRecording;
        this.modBadge.visible = this.isOwner && !this.isRecording;
        this.handRaised.visible = this.isHandRaised;

        this.neck.getWorldPosition(worldPos);
        worldPos.setY(this.nametagElPosY + this.ikRoot.position.y);
        mat.setPosition(worldPos);
        setMatrixWorld(this.nametag, mat);
      } else {
        this.nametag.visible = false;
      }

      if (DEBUG) {
        this.updateAvatarModelBBAA();
        this.avatarBBAAHelper.matrixNeedsUpdate = true;
        this.avatarBBAAHelper.updateMatrixWorld(true);
      }
    };
  })(),

  play() {
    this.el.parentEl.addEventListener("model-loading", this.onModelLoading);
    this.el.parentEl.addEventListener("model-loaded", this.onModelLoaded);
    this.el.parentEl.addEventListener("ik-first-tick", this.onModelIkFirstTick);
    this.el.sceneEl.addEventListener("presence_updated", this.onPresenceUpdated);
    window.APP.store.addEventListener("statechanged", this.onStateChanged);
  },

  pause() {
    this.el.parentEl.removeEventListener("model-loading", this.onModelLoading);
    this.el.parentEl.removeEventListener("model-loaded", this.onModelLoaded);
    this.el.parentEl.removeEventListener("ik-first-tick", this.onModelIkFirstTick);
    this.el.sceneEl.removeEventListener("presence_updated", this.onPresenceUpdated);
    window.APP.store.removeEventListener("statechanged", this.onStateChanged);
  },

  onPresenceUpdated({ detail: presenceMeta }) {
    if (presenceMeta.sessionId === this.playerSessionId) {
      this.updateFromPresenceMeta(presenceMeta);
    }
  },

  updateFromPresenceMeta(presenceMeta) {
    this.displayName = presenceMeta.profile.displayName;
    this.identityName = presenceMeta.profile.identityName;
    this.isRecording = !!(presenceMeta.streaming || presenceMeta.recording);
    this.isOwner = !!(presenceMeta.roles && presenceMeta.roles.owner);
    this.isTyping = !!presenceMeta.typing;
    this.isHandRaised = !!presenceMeta.hand_raised;
    if (this.isAvatarReady) {
      this.updateDisplayName();
      this.updateHandRaised();
      this.resizeNameTag();
    }
  },

  updateDisplayName() {
    if (this.displayName && this.displayName !== this.prevDisplayName) {
      this.nametagText.el.addEventListener(
        "text-updated",
        () => {
          this.size = this.nametagText.el.components["text"].getSize();
          this.size.x = Math.max(this.size.x, NAMETAG_MIN_WIDTH);
          this.resizeNameTag();
        },
        { once: true }
      );
      if (this.displayName.length > DISPLAY_NAME_LENGTH) {
        this.displayName = this.displayName.slice(0, DISPLAY_NAME_LENGTH).concat("...");
      }
      this.nametagText.el.setAttribute("text", {
        value: this.displayName
      });
      this.prevDisplayName = this.displayName;
    }

    if (this.identityName) {
      if (this.identityName.length > DISPLAY_NAME_LENGTH) {
        this.identityName = this.identityName.slice(0, DISPLAY_NAME_LENGTH).concat("...");
      }
      this.identityName.el.setAttribute("text", { value: this.identityName });
    }
  },

  onModelLoading() {
    this.model = null;
    this.isAvatarReady = false;
  },

  onModelLoaded({ detail: { model } }) {
    this.model = model;
  },

  onModelIkFirstTick() {
    this.ikRoot = findAncestorWithComponent(this.el, "ik-root").object3D;
    this.neck = this.ikRoot.el.querySelector(".Neck").object3D;
    this.audioAnalyzer = this.ikRoot.el.querySelector(".AvatarRoot").components["networked-audio-analyser"];

    this.updateAvatarModelBBAA();
    const tmpVector = new THREE.Vector3();
    this.nametagHeight =
      Math.abs(tmpVector.subVectors(this.ikRoot.position, this.avatarAABBCenter).y) +
      this.avatarAABBSize.y / 2 +
      NAMETAG_OFFSET;
    this.nametagElPosY = this.nametagHeight + (this.isHandRaised ? NAMETAG_OFFSET : 0);
    this.size = this.nametagText.el.components["text"].getSize();
    this.size.x = Math.max(this.size.x, NAMETAG_MIN_WIDTH);
    this.isAvatarReady = true;

    this.updateDisplayName();
    this.updateHandRaised();
    this.resizeNameTag();
  },

  onStateChanged() {
    this.nametagVisibilityDistance = Math.pow(
      this.store.state.preferences.nametagVisibilityDistance !== undefined
        ? this.store.state.preferences.nametagVisibilityDistance
        : NAMETAG_VISIBILITY_DISTANCE_DEFAULT,
      2
    );
    this.nametagVisibility = this.store.state.preferences.nametagVisibility;
  },

  resizeNameTag() {
    this.nametagBackground.el.setAttribute("slice9", {
      width: this.size.x + NAMETAG_BACKGROUND_PADDING * 2,
      height: NAMETAG_HEIGHT
    });
    this.nametagStatusBorder.el.setAttribute("slice9", {
      width: this.size.x + NAMETAG_BACKGROUND_PADDING * 2 + NAMETAG_STATUS_BORDER_PADDING,
      height: NAMETAG_HEIGHT + NAMETAG_STATUS_BORDER_PADDING
    });
  },

  updateHandRaised() {
    this.nametagStatusBorder.el.setAttribute(
      "text-button",
      `backgroundColor: ${getThemeColor(
        this.isHandRaised ? "nametag-border-color-raised-hand" : "nametag-border-color"
      )}`
    );
    const targetScale = this.isHandRaised ? 0.2 : 0;
    anime({
      ...ANIM_CONFIG,
      targets: {
        x: this.handRaised.scale.x,
        y: this.handRaised.scale.y,
        z: this.handRaised.scale.z
      },
      x: targetScale,
      y: targetScale,
      z: targetScale,
      update: anim => {
        this.handRaised.scale.set(
          anim.animatables[0].target.x,
          anim.animatables[0].target.y,
          anim.animatables[0].target.z
        );
        this.handRaised.matrixNeedsUpdate = true;
      }
    });
    anime({
      ...ANIM_CONFIG,
      targets: {
        y: this.nametagElPosY
      },
      y: this.nametagHeight + (this.isHandRaised ? NAMETAG_OFFSET : 0),
      update: anim => {
        this.nametagElPosY = anim.animatables[0].target.y;
      }
    });
  },

  updateAvatarModelBBAA() {
    if (!this.model) return;
    this.avatarAABB.setFromObject(this.model);
    this.avatarAABB.getSize(this.avatarAABBSize);
    this.avatarAABB.getCenter(this.avatarAABBCenter);
  }
});