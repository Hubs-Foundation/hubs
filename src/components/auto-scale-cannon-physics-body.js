function almostEquals(epsilon, u, v) {
  return Math.abs(u.x - v.x) < epsilon && Math.abs(u.y - v.y) < epsilon && Math.abs(u.z - v.z) < epsilon;
}

AFRAME.registerComponent("auto-scale-cannon-physics-body", {
  dependencies: ["body"],

  init() {
    this.body = this.el.components["body"];
    this.prevScale = this.el.object3D.scale.clone();
    this.nextUpdateTime = -1;
  },

  tick(t) {
    const scale = this.el.object3D.scale;
    // Note: This only checks if the LOCAL scale of the object3D changes.
    if (!almostEquals(0.001, scale, this.prevScale)) {
      this.prevScale.copy(scale);
      this.nextUpdateTime = t + 100;
    }

    if (this.nextUpdateTime > 0 && t > this.nextUpdateTime) {
      this.nextUpdateTime = -1;
      this.body.updateCannonScale();
    }
  }
});
