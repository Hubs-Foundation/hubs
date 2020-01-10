AFRAME.registerComponent("scale-in-screen-space", {
  schema: {
    baseScale: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    addedScale: { type: "vec3", default: { x: 1, y: 1, z: 1 } }
  },

  play() {
    if (!this.didRegister) {
      this.didRegister = true;
      this.el.sceneEl.systems["hubs-systems"].scaleInScreenSpaceSystem.register(this);
    }
  },
  remove() {
    if (this.didRegister) {
      this.el.sceneEl.systems["hubs-systems"].scaleInScreenSpaceSystem.unregister(this);
    }
  }
});
