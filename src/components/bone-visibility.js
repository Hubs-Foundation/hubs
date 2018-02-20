AFRAME.registerComponent("bone-visibility", {
  schema: {
    type: "selector"
  },
  tick() {
    const targetEl = this.data;
    const visible = this.getAttribute("visible");

    if (this.lastVisible !== visible) {
      if (visible) {
        this.targetEl.object3D.scale.set(1, 1, 1);
      } else {
        // Three.js doesn't like updating matrices with 0 scale, so we set it to a near zero number.
        this.targetEl.object3D.scale.set(0.00000001, 0.00000001, 0.00000001);
      }

      this.lastVisible = visible;
    }
  }
});
