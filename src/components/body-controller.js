AFRAME.registerComponent("body-controller", {
  schema: {
    head: { type: "selector" },
    speed: { default: 0.07 }
  },
  init() {
    this.targetAngle = new THREE.Quaternion();
  },
  tick(time, dt) {
    const object3D = this.el.object3D;

    const headQuat = this.data.head.object3D.quaternion;
    this.targetAngle.set(0, headQuat.y, 0, headQuat.w);

    object3D.quaternion.slerp(this.targetAngle, this.data.speed);

    const object3DRotation = object3D.rotation;
    this.el.setAttribute("rotation", {
      x: object3DRotation.x * THREE.Math.RAD2DEG,
      y: object3DRotation.y * THREE.Math.RAD2DEG,
      z: object3DRotation.z * THREE.Math.RAD2DEG
    });
  }
});
