AFRAME.registerComponent("body-controller", {
  schema: {
    camera: { type: "selector", default: "[camera]" },
    rotationSpeed: { default: 0.07 },
    eyeNeckOffset: { type: "vec3" },
    neckHeight: { type: "number" }
  },

  init() {
    this.targetAngleEuler = new THREE.Euler();
    this.targetAngle = new THREE.Quaternion();
    this.cameraPositionMatrix = new THREE.Matrix4();
    const offset = this.data.eyeNeckOffset;
    this.eyeNeckTransformMatrix = new THREE.Matrix4().makeTranslation(
      offset.x,
      offset.y,
      offset.z
    );
    this.neckTransformMatrix = new THREE.Matrix4().makeTranslation(
      0,
      this.data.neckHeight,
      0
    );
    this.bodyPositionMatrix = new THREE.Matrix4();
    this.bodyPositionVector = new THREE.Vector3();
  },

  tick(time, dt) {
    const object3D = this.el.object3D;
    const cameraObject3D = this.data.camera.object3D;

    // Set Rotation
    this.targetAngleEuler.set(0, cameraObject3D.rotation.y, 0);
    this.targetAngle.setFromEuler(this.targetAngleEuler);
    object3D.quaternion.slerp(this.targetAngle, this.data.rotationSpeed);
    const object3DRotation = object3D.rotation;
    this.el.setAttribute("rotation", {
      x: object3DRotation.x * THREE.Math.RAD2DEG,
      y: object3DRotation.y * THREE.Math.RAD2DEG,
      z: object3DRotation.z * THREE.Math.RAD2DEG
    });

    //Set Position
    this.bodyPositionMatrix.copy(cameraObject3D.matrix);
    this.bodyPositionMatrix.multiply(this.eyeNeckTransformMatrix);
    this.bodyPositionVector.setFromMatrixPosition(this.bodyPositionMatrix);
    this.el.setAttribute("position", this.bodyPositionVector);
  }
});
