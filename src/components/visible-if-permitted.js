AFRAME.registerComponent("visible-if-permitted", {
  schema: {
    type: "string"
  },
  init() {
    this.el.object3D.visible = this.el.sceneEl.systems.permissions.can(this.data);
  }
});
