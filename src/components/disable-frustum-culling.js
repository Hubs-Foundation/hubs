AFRAME.registerComponent("disable-frustum-culling", {
  init() {
    this.el.object3D.traverse(o => (o.frustumCulled = false));
  }
});
