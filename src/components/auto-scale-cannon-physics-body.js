function almostEquals(epsilon, u, v) {
  return Math.abs(u.x - v.x) < epsilon && Math.abs(u.y - v.y) < epsilon && Math.abs(u.z - v.z) < epsilon;
}

AFRAME.registerComponent("auto-scale-cannon-physics-body", {
  dependencies: ["body"],
  schema: {
    equalityEpsilon: { default: 0.001 },
    debounceDelay: { default: 100 }
  },

  init() {
    this.body = this.el.components["body"];
    this.prevScale = this.el.object3D.scale.clone();
    this.nextUpdateTime = -1;
  },

  tick(t) {
    const scale = this.el.object3D.scale;
    // Note: This only checks if the LOCAL scale of the object3D changes.
    if (!almostEquals(this.data.equalityEpsilon, scale, this.prevScale)) {
      this.prevScale.copy(scale);
      this.nextUpdateTime = t + this.data.debounceDelay;
    }

    if (this.nextUpdateTime > 0 && t > this.nextUpdateTime) {
      this.nextUpdateTime = -1;
      this.body.updateCannonScale();
    }
  }
});
