AFRAME.registerComponent("body-controller", {
  schema: {
    head: { type: "selector" },
    speed: { default: 0.07 },
    eyeNeckOffset: { type: "vec3", default: { x: 0, y: -0.153, z: 0.13 } },
    neckHeight: { default: 0.15 }
  },
  init() {
    this.targetAngle = new THREE.Quaternion();
    this.headPosition = new THREE.Vector3();
  },
  tick(time, dt) {
    const object3D = this.el.object3D;
    const headObject3D = this.data.head.object3D;

    const headQuat = headObject3D.quaternion;
    this.targetAngle.set(0, headQuat.y, 0, headQuat.w);

    object3D.quaternion.slerp(this.targetAngle, this.data.speed);

    const object3DRotation = object3D.rotation;
    this.el.setAttribute("rotation", {
      x: object3DRotation.x * THREE.Math.RAD2DEG,
      y: object3DRotation.y * THREE.Math.RAD2DEG,
      z: object3DRotation.z * THREE.Math.RAD2DEG
    });
    this.el.setAttribute("position", {
      x: headObject3D.position.x,
      y: headObject3D.position.y - this.data.neckHeight,
      z: headObject3D.position.z
    });
  }
});
