AFRAME.registerComponent("body-controller", {
  schema: {
    head: { type: "selector" },
    leftHand: { type: "selector" },
    rightHand: { type: "selector" },
    headWeight: { default: 1 },
    handWeight: { default: 1.5 },
    speed: { default: 0.01 }
  },
  init() {
    this.rotation = new THREE.Euler();
    this.quaternion = new THREE.Quaternion();
    this.targetAngle = new THREE.Quaternion();
    this.headForward = new THREE.Vector3();
    this.headToLeftHand = new THREE.Vector3();
    this.headToRightHand = new THREE.Vector3();
  },
  tick(time, dt) {
    const object3D = this.el.object3D;
    const object3DRotation = object3D.rotation;

    this.targetAngle.copy(this.data.head.object3D.quaternion);

    // if (this.data.leftHand.components.visible.data) {
    // }
    // if (this.data.rightHand.components.visible.data) {
    // }

    THREE.Quaternion.slerp(
      object3D.quaternion,
      this.targetAngle,
      this.quaternion,
      dt * this.data.speed
    );

    this.rotation.setFromQuaternion(this.quaternion);

    const object3DYDeg = object3DRotation.y * THREE.Math.RAD2DEG;
    const rotationYDeg = this.rotation.y * THREE.Math.RAD2DEG;

    if (Math.abs(object3DYDeg - rotationYDeg) > 5) {
      this.el.setAttribute("rotation", {
        x: object3DRotation.x * THREE.Math.RAD2DEG,
        y: rotationYDeg,
        z: object3DRotation.z * THREE.Math.RAD2DEG
      });
    }
  }
});
