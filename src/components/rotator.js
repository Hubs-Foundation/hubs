const DEG2RAD = THREE.Math.DEG2RAD;

AFRAME.registerComponent("rotator", {
  schema: {
    axis: {
      type: "vec3"
    },
    speed: {
      type: "number"
    }
  },

  tick(time, dt) {
    this.el.object3D.rotateOnAxis(this.data.axis, dt * this.data.speed * DEG2RAD);
  }
});
