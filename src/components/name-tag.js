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
    this.tmpNametagVisible = false;

    this.onPresenceUpdated = this.onPresenceUpdated.bind(this);
    this.onModelLoading = this.onModelLoading.bind(this);
    this.onModelLoaded = this.onModelLoaded.bind(this);
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
    this.nametagVisibilityDistance = this.nametagVisibilityDistance =
      this.store.state.preferences.nametagVisibilityDistance !== undefined
        ? this.store.state.preferences.nametagVisibilityDistance
        : NAMETAG_VISIBILITY_DISTANCE_DEFAULT;
    this.updateNameTagVisibility();
  },

  remove() {
    clearInterval(this.firstIkStepHandler);
    if (DEBUG) this.el.sceneEl.object3D.remove(this.avatarBBAAHelper);
  },

  tick: (() => {
    let typingAnimTime = 0;
    const worldPos = new THREE.Vector3();
    const avatarRigWorldPos = new THREE.Vector3();
    const matPos = new THREE.Vector3();
    const matRot = new THREE.Quaternion();
    const matScale = new THREE.Vector3();
    const mat = new THREE.Matrix4();
    return function(t) {
      if (this.nametagVisibility === "showClose") {
        this.avatarRig.getWorldPosition(avatarRigWorldPos);
        this.el.object3D.getWorldPosition(worldPos);
        this.wasNametagVisible = this.shouldBeVisible;
        this.shouldBeVisible = avatarRigWorldPos.sub(worldPos).length() < this.nametagVisibilityDistance;
      }
      if (!this.isTalking && this.isTyping) {
        typingAnimTime = t;
        this.nametagTyping.traverse(o => {
          if (o.material) {
            o.material.opacity = (Math.sin(typingAnimTime / TYPING_ANIM_SPEED) + 1) / 2;
            typingAnimTime -= TYPING_ANIM_SPEED;
          }
        });
      }
      if (this.model) {
        this.updateAnalyserVolume(this.audioAnalyzer.volume);
        this.neck.matrixWorld.decompose(matPos, matRot, matScale);
        matScale.set(1, 1, 1);
        matPos.setY(this.nametagElPosY + this.ikRoot.position.y);
        mat.compose(
          matPos,
          matRot,
          matScale
        );
        setMatrixWorld(this.nametag, mat);

        this.el.object3D.visible = this.shouldBeVisible && this.tmpNametagVisible;
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
    this.el.sceneEl.addEventListener("presence_updated", this.onPresenceUpdated);
    window.APP.store.addEventListener("statechanged", this.onStateChanged);
  },

  pause() {
    this.el.parentEl.removeEventListener("model-loading", this.onModelLoading);
    this.el.parentEl.removeEventListener("model-loaded", this.onModelLoaded);
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
    this.updateNameTag();
  },

  updateDisplayName() {
    if (this.displayName) {
      this.nametagText.el.addEventListener(
        "text-updated",
        () => {
          this.size = this.nametagText.el.components["text"].getSize();
          this.size.x = Math.max(this.size.x, NAMETAG_MIN_WIDTH);
          this.updateNameTag();
        },
        { once: true }
      );
      if (this.displayName.length > DISPLAY_NAME_LENGTH) {
        this.displayName = this.displayName.slice(0, DISPLAY_NAME_LENGTH).concat("...");
      }
      this.nametagText.el.setAttribute("text", {
        value: this.displayName
      });
    }

    if (this.identityName) {
      if (this.identityName.length > DISPLAY_NAME_LENGTH) {
        this.identityName = this.identityName.slice(0, DISPLAY_NAME_LENGTH).concat("...");
      }
      this.identityName.el.setAttribute("text", { value: this.identityName });
    }
  },

  onModelLoading() {
    this.tmpNametagVisible = false;
    this.model = null;
  },

  onModelLoaded({ detail: { model } }) {
    clearInterval(this.firstIkStepHandler);
    const checkIkStep = () => {
      this.ikRoot = findAncestorWithComponent(this.el, "ik-root").object3D;
      this.playerInfo = this.ikRoot.el.components["player-info"];
      if (this.ikRoot.visible) {
        clearInterval(this.firstIkStepHandler);
        this.neck = this.ikRoot.el.querySelector(".Neck").object3D;
        this.audioAnalyzer = this.ikRoot.el.querySelector(".AvatarRoot").components["networked-audio-analyser"];
        this.tmpNametagVisible = true;
        this.model = model;
        this.updateNameTagPosition();
      }
    };
    this.firstIkStepHandler = setInterval(checkIkStep, 500);
  },

  updateNameTagPosition() {
    this.updateAvatarModelBBAA();
    const tmpVector = new THREE.Vector3();
    this.nametagHeight =
      Math.abs(tmpVector.subVectors(this.ikRoot.position, this.avatarAABBCenter).y) +
      this.avatarAABBSize.y / 2 +
      NAMETAG_OFFSET;
    this.nametagElPosY = this.nametagHeight;
    this.size = this.nametagText.el.components["text"].getSize();
    this.size.x = Math.max(this.size.x, NAMETAG_MIN_WIDTH);
    this.updateNameTag();
  },

  updateAnalyserVolume(volume) {
    let isTalking = false;
    this.volume = volume;
    this.volumeAvg.push(Date.now(), volume);
    if (!this.playerInfo?.data.muted) {
      const average = this.volumeAvg.movingAverage();
      isTalking = average > 0.01;
    }
    this.wasTalking = this.isTalking;
    this.isTalking = isTalking;
    if (this.nametagVisibility === "showSpeaking") {
      if (!this.isTalking && this.wasTalking) {
        this.frozenTimer = setTimeout(() => {
          this.wasNametagVisible = this.shouldBeVisible;
          this.shouldBeVisible = false;
          this.shouldBeVisible !== this.wasNametagVisible && this.updateNameTag();
        }, 1000);
      } else if (this.isTalking && !this.wasTalking) {
        clearTimeout(this.frozenTimer);
        this.wasNametagVisible = this.shouldBeVisible;
        this.shouldBeVisible = true;
        this.shouldBeVisible !== this.wasNametagVisible && this.updateNameTag();
      }
    }
    this.shouldBeVisible && this.isTalking !== this.wasTalking && this.updateBorder();
    this.shouldBeVisible && this.updateVolume();
  },

  onStateChanged() {
    this.updateNameTagVisibility();
  },

  updateNameTagVisibility() {
    this.nametagVisibilityDistance =
      this.store.state.preferences.nametagVisibilityDistance !== undefined
        ? this.store.state.preferences.nametagVisibilityDistance
        : NAMETAG_VISIBILITY_DISTANCE_DEFAULT;
    this.wasNametagVisible = this.shouldBeVisible;
    if (this.nametagVisibility === "showNone") {
      this.shouldBeVisible = false;
    } else if (this.nametagVisibility === "showAll") {
      this.shouldBeVisible = true;
    } else if (this.nametagVisibility === "showFrozen") {
      this.shouldBeVisible = this.el.sceneEl.is("frozen");
    } else if (this.nametagVisibility === "showSpeaking") {
      this.shouldBeVisible = this.isTalking;
    } else {
      this.shouldBeVisible = true;
    }
  },

  updateNameTag() {
    if (!this.model) return;
    this.updateDisplayName();
    this.updateContainer();
    this.updateVolume();
    this.updateState();
  },

  updateContainer() {
    this.nametagBackground.el.setAttribute("slice9", {
      width: this.size.x + NAMETAG_BACKGROUND_PADDING * 2,
      height: NAMETAG_HEIGHT
    });
    this.updateBorder();
  },

  updateVolume() {
    this.nametagVolume.visible = this.isTalking;
    this.nametagVolume.el.setAttribute("scale", { x: this.volume * this.size.x });
    this.updateTyping();
  },

  updateBorder() {
    this.nametagStatusBorder.visible = this.isTyping || this.isTalking || this.isHandRaised;
    this.nametagStatusBorder.el.setAttribute("slice9", {
      width: this.size.x + NAMETAG_BACKGROUND_PADDING * 2 + NAMETAG_STATUS_BORDER_PADDING,
      height: NAMETAG_HEIGHT + NAMETAG_STATUS_BORDER_PADDING
    });
    this.nametagStatusBorder.el.setAttribute(
      "text-button",
      `backgroundColor: ${getThemeColor(
        this.isHandRaised ? "nametag-border-color-raised-hand" : "nametag-border-color"
      )}`
    );
  },

  updateState() {
    this.recordingBadge.visible = this.isRecording;
    this.modBadge.visible = this.isOwner && !this.isRecording;
    this.handRaised.visible = this.isHandRaised;
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
    this.updateTyping();
  },

  updateTyping() {
    for (const dot of this.nametagTyping.children) {
      dot.visible = this.isTyping && !this.isTalking;
    }
  },

  updateAvatarModelBBAA() {
    if (!this.model) return;
    this.avatarAABB.setFromObject(this.model);
    this.avatarAABB.getSize(this.avatarAABBSize);
    this.avatarAABB.getCenter(this.avatarAABBCenter);
  }
});
