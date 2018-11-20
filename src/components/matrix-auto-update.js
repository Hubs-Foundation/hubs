AFRAME.registerComponent("matrix-auto-update", {
  schema: {
    target: { type: "string" }
  },

  init: function() {
    if (this.data.target) {
      this.el.getObject3D(this.data.target).matrixAutoUpdate = true;
    } else {
      this.el.object3D.matrixAutoUpdate = true;
    }
  }
});
