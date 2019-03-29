const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;
/* global AFRAME */
AFRAME.registerComponent("sticky-object", {
  schema: {
    autoLockOnLoad: { default: false },
    autoLockOnRelease: { default: false },
    autoLockSpeedLimit: { default: 0.5 } // Set to 0 to always autolock on release
  },

  init() {
    this.onGrab = this.onGrab.bind(this);
    this.onRelease = this.onRelease.bind(this);
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

    this.el.setAttribute("ammo-body", { collisionFilterGroup: COLLISION_LAYERS.DYNAMIC_OBJECTS });
  },

  onGrab() {
    this.el.setAttribute("ammo-body", {
      collisionFilterGroup: this.locked ? COLLISION_LAYERS.STICKY_OBJECTS : COLLISION_LAYERS.DYNAMIC_OBJECTS
    });
    this.setLocked(false);
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
