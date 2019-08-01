/* global AFRAME */
const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;

AFRAME.registerComponent("floaty-object", {
  schema: {
    // Make the object locked/kinematic upon load
    autoLockOnLoad: { default: false },

    // Make the object kinematic immediately upon release
    autoLockOnRelease: { default: false },

    // On release, modify the gravity based upon gravitySpeedLimit. If less than this, let the object float
    // otherwise apply releaseGravity.
    modifyGravityOnRelease: { default: false },

    // Gravity to apply if object is thrown at a speed greated than speed limit.
    releaseGravity: { default: -2 },

    // If true, the degree to which angular rotation is allowed when floating is reduced (useful for 2d media)
    reduceAngularFloat: { default: false },

    // Velocity speed limit under which gravity will not be added if modifyGravityOnRelease is true
    gravitySpeedLimit: { default: 1.85 } // Set to 0 to never apply gravity
  },

  init() {
    this.onGrab = this.onGrab.bind(this);
    this.onRelease = this.onRelease.bind(this);
  },

  tick() {
    if (!this.ammoBody) {
      this.ammoBody = this.el.components["ammo-body"];
    }

    const interaction = AFRAME.scenes[0].systems.interaction;
    const isHeld = interaction.isHeld(this.el);
    if (isHeld && !this.wasHeld) {
      this.onGrab();
    }
    if (this.wasHeld && !isHeld) {
      this.onRelease();
    }

    if (!isHeld && this._makeStaticWhenAtRest) {
      const isMine = this.el.components.networked && NAF.utils.isMine(this.el);
      const linearThreshold = this.ammoBody.data.linearSleepingThreshold;
      const angularThreshold = this.ammoBody.data.angularSleepingThreshold;
      const isAtRest =
        this.ammoBody.body.getLinearVelocity().length2() < linearThreshold * linearThreshold &&
        this.ammoBody.body.getAngularVelocity().length2() < angularThreshold * angularThreshold;

      if (isAtRest && isMine) {
        this.el.setAttribute("ammo-body", { type: "static" });
      }

      if (isAtRest || !isMine) {
        this._makeStaticWhenAtRest = false;
      }
    }

    this.wasHeld = isHeld;
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
    if (this.data.modifyGravityOnRelease) {
      if (
        this.data.gravitySpeedLimit === 0 ||
        this.ammoBody.getVelocity().length2() < this.data.gravitySpeedLimit * this.data.gravitySpeedLimit
      ) {
        this.el.setAttribute("ammo-body", {
          gravity: { x: 0, y: 0, z: 0 },
          angularDamping: this.data.reduceAngularFloat ? 0.98 : 0.5,
          linearDamping: 0.95,
          linearSleepingThreshold: 0.1,
          angularSleepingThreshold: 0.1,
          collisionFilterMask: COLLISION_LAYERS.HANDS
        });

        this._makeStaticWhenAtRest = true;
      } else {
        this.el.setAttribute("ammo-body", {
          gravity: { x: 0, y: this.data.releaseGravity, z: 0 },
          angularDamping: 0.01,
          linearDamping: 0.01,
          linearSleepingThreshold: 1.6,
          angularSleepingThreshold: 2.5,
          collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE
        });
      }
    } else {
      this.el.setAttribute("ammo-body", { collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE });
    }

    if (this.data.autoLockOnRelease) {
      this.setLocked(true);
    }
  },

  onGrab() {
    this.el.setAttribute("ammo-body", {
      collisionFilterMask: COLLISION_LAYERS.HANDS
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
