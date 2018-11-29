/**
 * Scales an object to near-zero if the object is invisible. Useful for bones representing avatar body parts.
 * @namespace avatar
 * @component bone-visibility
 */
AFRAME.registerComponent("bone-visibility", {
  tick() {
    const { visible } = this.el.object3D;

    if (this.lastVisible !== visible) {
      if (visible) {
        this.el.object3D.scale.set(1, 1, 1);
      } else {
        // Three.js doesn't like updating matrices with 0 scale, so we set it to a near zero number.
        this.el.object3D.scale.set(0.00000001, 0.00000001, 0.00000001);
      }

      this.lastVisible = visible;
      this.el.object3D.updateMatrices(true, true);
      this.el.object3D.updateMatrixWorld(true, true);
    }
  }
});
