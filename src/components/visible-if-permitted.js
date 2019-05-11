AFRAME.registerComponent("visible-if-permitted", {
  schema: {
    type: "string"
  },
  init() {
    this.updateVisibility = this.updateVisibility.bind(this);
    this.updateVisibility();
    window.APP.hubChannel.addEventListener("permissions_updated", this.updateVisibility);
  },
  updateVisibility() {
    this.el.object3D.visible = this.el.sceneEl.systems.permissions.canOrWillIfCreator(this.data);
  },
  remove() {
    window.APP.hubChannel.removeEventListener("permissions_updated", this.updateVisibility);
  }
});
