/* global THREE, CANNON, AFRAME */
AFRAME.registerComponent("remove-object-button", {
  init() {
    this.onClick = () => {
      this.targetEl.parentNode.removeChild(this.targetEl);
    };
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });
  },

  play() {
    this.el.addEventListener("click", this.onClick);
  },

  pause() {
    this.el.removeEventListener("click", this.onClick);
  }
});

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
    // TODO: position/rotation/impulse need to get updated if the sticky-object-zone moves
    this.worldQuaternion = new THREE.Quaternion();
    this.worldPosition = new THREE.Vector3();
    this.el.object3D.getWorldQuaternion(this.worldQuaternion);
    this.el.object3D.getWorldPosition(this.worldPosition);

    const dir = new THREE.Vector3(0, 0, 5).applyQuaternion(this.el.object3D.quaternion);
    this.bootImpulsePosition = new CANNON.Vec3(0, 0, 0);
    this.bootImpulse = new CANNON.Vec3();
    this.bootImpulse.copy(dir);

    this.el.addEventListener("collisions", e => {
      console.log("collisions", e.detail.els, e.detail.clearedEls);
      e.detail.els.forEach(el => {
        const stickyObject = el.components["sticky-object"];
        if (!stickyObject) return;
        this._setStuckObject(stickyObject);
      });
      if (this.stuckObject) {
        e.detail.clearedEls.forEach(el => {
          if (this.stuckObject && this.stuckObject.el === el) {
            delete this.stuckObject;
          }
        });
      }
    });
  },

  _setStuckObject(stickyObject) {
    stickyObject.setLocked(true);
    stickyObject.el.object3D.position.copy(this.worldPosition);
    stickyObject.el.object3D.quaternion.copy(this.worldQuaternion);
    stickyObject.el.body.collisionResponse = false;

    if (this.stuckObject && NAF.utils.isMine(this.stuckObject.el)) {
      console.log("booting out object");
      this.stuckObject.setLocked(false);
      this.stuckObject.el.body.collisionResponse = true;
      this.stuckObject.el.body.applyImpulse(this.bootImpulse, this.bootImpulsePosition);
    }

    this.stuckObject = stickyObject;
  }
});
