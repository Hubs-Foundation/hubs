function quaternionAlmostEquals(epsilon, u, v) {
  // Note: q and -q represent same rotation
  return (
    (Math.abs(u.x - v.x) < epsilon &&
      Math.abs(u.y - v.y) < epsilon &&
      Math.abs(u.z - v.z) < epsilon &&
      Math.abs(u.w - v.w) < epsilon) ||
    (Math.abs(-u.x - v.x) < epsilon &&
      Math.abs(-u.y - v.y) < epsilon &&
      Math.abs(-u.z - v.z) < epsilon &&
      Math.abs(-u.w - v.w) < epsilon)
  );
}

AFRAME.registerComponent("transform-gizmo", {
  init() {
    this.targetEL = null;
  },

  tick() {
    if (
      this.targetEl &&
      !quaternionAlmostEquals(0.001, this.targetEl.object3D.quaternion, this.el.object3D.quaternion)
    ) {
      const transformObjectSystem = AFRAME.scenes[0].systems["transform-selected-object"];
      if (transformObjectSystem.transforming && transformObjectSystem.target.el === this.el) {
        this.targetEl.object3D.quaternion.copy(this.el.object3D.quaternion);
        this.targetEl.object3D.matrixNeedsUpdate = true;
      } else {
        this.el.object3D.quaternion.copy(this.targetEl.object3D.quaternion);
        this.el.object3D.matrixNeedsUpdate = true;
      }
    }
  }
});
