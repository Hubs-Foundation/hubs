/* global THREE, CANNON, AFRAME */
AFRAME.registerComponent("sticky-object", {
  dependencies: ["body", "super-networked-interactable"],

  schema: {
    autoLockOnLoad: { default: false },
    autoLockOnRelease: { default: false },
    autoLockSpeedLimit: { default: 0.25 }
  },

  init() {
    this._onGrab = this._onGrab.bind(this);
    this._onRelease = this._onRelease.bind(this);
    this._onBodyLoaded = this._onBodyLoaded.bind(this);
  },

  play() {
    this.el.addEventListener("grab-start", this._onGrab);
    this.el.addEventListener("grab-end", this._onRelease);
    this.el.addEventListener("body-loaded", this._onBodyLoaded);
  },

  pause() {
    this.el.removeEventListener("grab-start", this._onGrab);
    this.el.removeEventListener("grab-end", this._onRelease);
    this.el.removeEventListener("body-loaded", this._onBodyLoaded);
  },

  setLocked(locked) {
    if (!NAF.utils.isMine(this.el)) return;

    const mass = this.el.components["super-networked-interactable"].data.mass;
    this.locked = locked;
    this.el.body.type = locked ? window.CANNON.Body.STATIC : window.CANNON.Body.DYNAMIC;
    this.el.setAttribute("body", {
      mass: locked ? 0 : mass
    });
  },

  _onBodyLoaded() {
    if (this.data.autoLockOnLoad) {
      this.setLocked(true);
    }
  },

  _onRelease() {
    if (
      this.data.autoLockOnRelease &&
      this.el.body.velocity.lengthSquared() < this.data.autoLockSpeedLimit * this.data.autoLockSpeedLimit
    ) {
      this.setLocked(true);
    }
  },

  _onGrab() {
    this.setLocked(false);
  },

  remove() {
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
    this.el.object3D.getWorldQuaternion(this.worldQuaternion);
    this.el.object3D.getWorldPosition(this.worldPosition);

    const dir = new THREE.Vector3(0, 0, 5).applyQuaternion(this.el.object3D.quaternion);
    this.bootImpulsePosition = new CANNON.Vec3(0, 0, 0);
    this.bootImpulse = new CANNON.Vec3();
    this.bootImpulse.copy(dir);

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
    stickyObject.el.body.collisionResponse = false;
    stickyObject.stuckTo = this;

    if (this.stuckObject && NAF.utils.isMine(this.stuckObject.el)) {
      const el = this.stuckObject.el;
      this._unstickObject();
      el.body.applyImpulse(this.bootImpulse, this.bootImpulsePosition);
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
