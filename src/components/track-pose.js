AFRAME.registerComponent("track-pose", {
  schema: {
    path: { type: "string" }
  },

  tick() {
    const matrix = AFRAME.scenes[0].systems.userinput.get(this.data.path);
    if (matrix) {
      const o = this.el.object3D;
      o.matrix.copy(matrix);
      o.matrix.decompose(o.position, o.quaternion, o.scale);
      o.matrixIsModified = true;
    }
  }
});
