/* global THREE, CANNON, AFRAME */
AFRAME.registerComponent("sticky-object", {
  dependencies: ["body", "super-networked-interactable"],

  schema: {
    autoLockOnLoad: { default: false },
    autoLockOnRelease: { default: false },
    autoLockSpeedLimit: { default: 1 }
  },

  init() {
    this._onGrab = this._onGrab.bind(this);
    this._onRelease = this._onRelease.bind(this);
    this._onBodyLoaded = this._onBodyLoaded.bind(this);
    this.el.addEventListener("grab-start", this._onGrab);
    this.el.addEventListener("grab-end", this._onRelease);
    this.el.addEventListener("body-loaded", this._onBodyLoaded);
  },

  setLocked(locked) {
    if (!NAF.utils.isMine(this.el)) {
      console.log("Object not mine, ignoring setting locked: ", locked);
      return;
    }
    const mass = this.el.components["super-networked-interactable"].data.mass;
    console.log("setting locked", locked, mass);
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
  }
});

AFRAME.registerComponent("sticky-object-zone", {
  dependencies: ["physics"],
  init() {
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    this.el.object3D.getWorldQuaternion(q);
    this.el.object3D.getWorldPosition(p);
    this.el.addEventListener("collisions", e => {
      console.log("collisions", e.detail.els, e.detail.clearedEls);
      e.detail.els.forEach(el => {
        const stickyObject = el.components["sticky-object"];
        if (!stickyObject) return;

        stickyObject.setLocked(true);
        el.object3D.position.copy(p);
        el.object3D.quaternion.copy(q);
      });
    });
  }
});
