AFRAME.registerComponent("spin", {
  schema: {
    speed: { default: 1 }
  },
  tick(time, dt) {
    const rotation = this.el.object3D.rotation;
    this.el.setAttribute("rotation", {
      x:
        this.data.speed * dt * 0.0001 * THREE.Math.RAD2DEG +
        rotation.x * THREE.Math.RAD2DEG,
      y: rotation.y * THREE.Math.RAD2DEG,
      z: rotation.z * THREE.Math.RAD2DEG
    });
  }
});
