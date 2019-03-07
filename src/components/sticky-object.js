import { getLastWorldPosition, getLastWorldQuaternion } from "../utils/three-utils";

//TODO: decide on what these collision filters should actuallly be called, and move these somewhere else
const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;
/* global THREE, AFRAME */
AFRAME.registerComponent("sticky-object", {
  dependencies: ["ammo-body"],

  schema: {
    autoLockOnLoad: { default: false },
    autoLockOnRelease: { default: false },
    autoLockSpeedLimit: { default: 0.5 } // Set to 0 to always autolock on release
  },

  init() {
    this._onGrab = this._onGrab.bind(this);
    this._onRelease = this._onRelease.bind(this);
    this._onBodyLoaded = this._onBodyLoaded.bind(this);
  },

  play() {
    this.el.addEventListener("grab-start", this._onGrab);
    this.el.addEventListener("grab-end", this._onRelease);

    if (this.hasSetupBodyLoaded) return;
    this.hasSetupBodyLoaded = true;

    if (this.el.body) {
      this._onBodyLoaded();
    } else {
      this.el.addEventListener("body-loaded", this._onBodyLoaded, { once: true });
    }
  },

  pause() {
    this.el.removeEventListener("grab-start", this._onGrab);
    this.el.removeEventListener("grab-end", this._onRelease);
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

  _onRelease() {
    // Happens if the object is still being held by another hand
    if (this.el.is("grabbed")) return;
    if (
      this.data.autoLockOnRelease &&
      (this.data.autoLockSpeedLimit === 0 ||
        this.el.components["ammo-body"].getVelocity().length() < this.data.autoLockSpeedLimit)
    ) {
      this.setLocked(true);
    }

    this.el.setAttribute("ammo-body", { collisionFilterGroup: COLLISION_LAYERS.DYNAMIC_OBJECTS });
  },

  _onGrab() {
    if (!this.el.components.grabbable || this.el.components.grabbable.data.maxGrabbers === 0) return;

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

AFRAME.registerComponent("sticky-object-zone", {
  dependencies: ["physics"],
  init() {
    // TODO: position/rotation/impulse need to get updated if the sticky-object-zone moves
    this.worldQuaternion = new THREE.Quaternion();
    this.worldPosition = new THREE.Vector3();
    getLastWorldPosition(this.el.object3D, this.worldPosition);
    getLastWorldQuaternion(this.el.object3D, this.worldQuaternion);

    //TODO: support this with ammo
    // const dir = new THREE.Vector3(0, 0, 5).applyQuaternion(this.el.object3D.quaternion);
    // this.bootImpulsePosition = new CANNON.Vec3(0, 0, 0);
    // this.bootImpulse = new CANNON.Vec3();
    // this.bootImpulse.copy(dir);

    this._onCollisions = this._onCollisions.bind(this);
    this.el.addEventListener("collisions", this._onCollisions);
  },

  remove() {
    this.el.removeEventListener("collisions", this._onCollisions);
  },

  _onCollisions(e) {
    e.detail.els.forEach(el => {
      const stickyObject = el.components["sticky-object"];
      if (!stickyObject) return;
      this._setStuckObject(stickyObject);
    });
    if (this.stuckObject) {
      e.detail.clearedEls.forEach(el => {
        if (this.stuckObject && this.stuckObject.el === el) {
          this._unstickObject();
        }
      });
    }
  },

  _setStuckObject(stickyObject) {
    stickyObject.setLocked(true);
    stickyObject.el.object3D.position.copy(this.worldPosition);
    stickyObject.el.object3D.quaternion.copy(this.worldQuaternion);
    stickyObject.el.object3D.matrixNeedsUpdate = true;
    stickyObject.el.body.collisionResponse = false;
    stickyObject.stuckTo = this;

    if (this.stuckObject && NAF.utils.isMine(this.stuckObject.el)) {
      //TODO: support this with ammo
      // const el = this.stuckObject.el;
      this._unstickObject();
      // el.body.applyImpulse(this.bootImpulse, this.bootImpulsePosition);
    }

    this.stuckObject = stickyObject;
  },

  _unstickObject() {
    // this condition will be false when dragging an object directly from one sticky zone to another
    if (this.stuckObject.stuckTo === this) {
      this.stuckObject.setLocked(false);
      this.stuckObject.el.body.collisionResponse = true;
      delete this.stuckObject.stuckTo;
    }
    delete this.stuckObject;
  }
});
