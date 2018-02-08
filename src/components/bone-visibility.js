AFRAME.registerComponent("bone-visibility", {
  tick() {
    const visible = this.el.getAttribute("visible");

    if (this.lastVisible !== visible) {
      if (visible) {
        this.el.object3D.scale.set(1, 1, 1);
      } else {
        // Three.js doesn't like updating matrices with 0 scale, so we set it to a near zero number.
        this.el.object3D.scale.set(0.00000001, 0.00000001, 0.00000001);
      }

      this.lastVisible = visible;
    }
  }
});
