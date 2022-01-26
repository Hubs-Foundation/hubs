AFRAME.registerComponent("scale-in-screen-space", {
  schema: {
    baseScale: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    addedScale: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    scalePreferenceName: { type: "string" }
  },

  init() {
    this.preferredScale = new THREE.Vector3(1, 1, 1);
    this.storeUpdated = this.storeUpdated.bind(this);
  },
  play() {
    if (!this.didRegister) {
      this.didRegister = true;
      this.el.sceneEl.systems["hubs-systems"].scaleInScreenSpaceSystem.register(this);
      if (this.data.scalePreferenceName) {
        window.APP.store.addEventListener("statechanged", this.storeUpdated);
      }
    }
  },
  remove() {
    if (this.didRegister) {
      this.el.sceneEl.systems["hubs-systems"].scaleInScreenSpaceSystem.unregister(this);
      if (this.data.scalePreferenceName) {
        window.APP.store.removeEventListener("statechanged", this.storeUpdated);
      }
    }
  },
  storeUpdated() {
    if (!this.data.scalePreferenceName) return;
    const preferenceValue = window.APP.store.state.preferences[this.data.scalePreferenceName] || 1;
    this.preferredScale.x = preferenceValue * this.data.addedScale.x;
    this.preferredScale.y = preferenceValue * this.data.addedScale.y;
    this.preferredScale.z = preferenceValue * this.data.addedScale.z;
  }
});
