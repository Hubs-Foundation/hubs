AFRAME.registerComponent("bone-visibility", {
  tick() {
    const visible = this.el.getAttribute("visible");

    if (this.lastVisible !== visible) {
      if (visible) {
        this.el.object3D.scale.set(1, 1, 1);
      } else {
        this.el.object3D.scale.set(0, 0, 0);
      }

      this.lastVisible = visible;
    }
  }
});
