/* global AFRAME */

const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;

function almostEquals(epsilon, u, v) {
  return Math.abs(u.x - v.x) < epsilon && Math.abs(u.y - v.y) < epsilon && Math.abs(u.z - v.z) < epsilon;
}

AFRAME.registerComponent("sticky-object", {
  schema: {
    autoLockOnLoad: { default: false },
    autoLockOnRelease: { default: false },
    autoLockSpeedLimit: { default: 0.5 } // Set to 0 to always autolock on release
  },

  init() {
    this.onGrab = this.onGrab.bind(this);
    this.onRelease = this.onRelease.bind(this);
    this.prevScale = this.el.object3D.scale.clone();
    this.wasScaled = false;
  },

  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const heldLeftHand = interaction.state.leftHand.held === this.el;
    const heldRightHand = interaction.state.rightHand.held === this.el;
    const heldRightRemote = interaction.state.rightRemote.held === this.el;

    if (
      !heldLeftHand &&
      !heldRightHand &&
      !heldRightRemote &&
      (this.heldLeftHand || this.heldRightHand || this.heldRightRemote)
    ) {
      this.onRelease();
    }

    if (
      (heldLeftHand && !this.heldLeftHand) ||
      (heldRightHand && !this.heldRightHand) ||
      (heldRightRemote && !this.heldRightRemote)
    ) {
      this.onGrab();
    }

    this.heldLeftHand = heldLeftHand;
    this.heldRightHand = heldRightHand;
    this.heldRightRemote = heldRightRemote;

    if (!almostEquals(0.001, this.prevScale, this.el.object3D.scale)) {
      if ((!this.el.components.networked || NAF.utils.isMine(this.el)) && !this.wasScaled) {
        this.wasScaled = true;
        this.el.setAttribute("ammo-body", { collisionFilterMask: COLLISION_LAYERS.HANDS });
      }

      this.prevScale.copy(this.el.object3D.scale);
    }
  },

  play() {
    // We do this in play instead of in init because otherwise NAF.utils.isMine fails
    if (this.hasBeenHereBefore) return;
    this.hasBeenHereBefore = true;
    if (this.el.body) {
      this._onBodyLoaded();
    } else {
      this._onBodyLoaded = this._onBodyLoaded.bind(this);
      this.el.addEventListener("body-loaded", this._onBodyLoaded, { once: true });
    }
  },

  setLocked(locked) {
    if (this.el.components.networked && !NAF.utils.isMine(this.el)) return;

    this.locked = locked;
    this.el.setAttribute("ammo-body", { type: locked ? "kinematic" : "dynamic" });
  },

  _onBodyLoaded() {
    if (this.data.autoLockOnLoad) {
      this.setLocked(true);
    }
  },

  onRelease() {
    if (
      this.data.autoLockOnRelease &&
      (this.data.autoLockSpeedLimit === 0 ||
        this.el.components["ammo-body"].getVelocity().length() < this.data.autoLockSpeedLimit)
    ) {
      this.setLocked(true);
    }

    this.el.setAttribute("ammo-body", { collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE });
  },

  onGrab() {
    this.el.setAttribute("ammo-body", {
      collisionFilterMask: this.locked ? COLLISION_LAYERS.HANDS : COLLISION_LAYERS.DEFAULT_INTERACTABLE
    });
    this.setLocked(false);
    this.wasScaled = false;
  },

  remove() {
    this.el.removeEventListener("body-loaded", this._onBodyLoaded);
    if (this.stuckTo) {
      const stuckTo = this.stuckTo;
      delete this.stuckTo;
      stuckTo._unstickObject();
    }
  }
});
