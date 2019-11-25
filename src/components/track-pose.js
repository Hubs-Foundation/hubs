AFRAME.registerComponent("track-pose", {
  schema: {
    path: { type: "string" }
  },

  play() {
    if (!this.didRegister) {
      this.didRegister = true;
      this.el.sceneEl.systems["hubs-systems"].cursorPoseTrackingSystem.register(this.el.object3D, this.data.path);
    }
  },
  remove() {
    if (this.didRegister) {
      this.el.sceneEl.systems["hubs-systems"].cursorPoseTrackingSystem.unregister(this.el.object3D);
    }
  }
});
