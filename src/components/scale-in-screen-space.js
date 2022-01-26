AFRAME.registerComponent("scale-in-screen-space", {
  schema: {
    baseScale: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    addedScale: { type: "vec3", default: { x: 1, y: 1, z: 1 } }
  },

  init() {
    this.preferredScale = new THREE.Vector3();
    this.storeUpdated = this.storeUpdated.bind(this);
  },
  play() {
    if (!this.didRegister) {
      this.didRegister = true;
      this.el.sceneEl.systems["hubs-systems"].scaleInScreenSpaceSystem.register(this);
      window.APP.store.addEventListener("statechanged", this.storeUpdated);
    }
  },
  remove() {
    if (this.didRegister) {
      this.el.sceneEl.systems["hubs-systems"].scaleInScreenSpaceSystem.unregister(this);
      window.APP.store.removeEventListener("statechanged", this.storeUpdated);
    }
  },
  storeUpdated() {
    const { cursorSize } = window.APP.store.state.preferences;
    this.preferredScale.x = cursorSize * this.data.addedScale.x;
    this.preferredScale.y = cursorSize * this.data.addedScale.y;
    this.preferredScale.z = cursorSize * this.data.addedScale.z;
  }
});
