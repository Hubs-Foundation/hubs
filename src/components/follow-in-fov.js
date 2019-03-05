AFRAME.registerComponent("follow-in-fov", {
  schema: {
    target: { type: "selector" },
    offset: { type: "vec3" },
    speed: { type: "number", default: 0.003 },
    angle: { type: "number", default: 45 }
  },

  init() {
    this.targetPos = new THREE.Vector3();
    this.offset = new THREE.Vector3();
    this.offset.copy(this.data.offset);

    this.snappedRot = new THREE.Euler();
    this.snappedQ = new THREE.Quaternion();
    this.snappedXForm = new THREE.Matrix4();
    this.snappedXFormWorld = new THREE.Matrix4();
    this.tempVector = new THREE.Vector3();
  },

  tick(t, dt) {
    if (!this.el.object3D.visible) return;

    const obj = this.el.object3D;
    const target = this.data.target.object3D;

    // Compute position + rotation by projecting offset along a downward ray in target space,
    // and mask out Z rotation.
    this._applyMaskedTargetRotation(
      -this.data.angle * THREE.Math.DEG2RAD,
      target.rotation.y,
      0,
      this.snappedXFormWorld
    );

    this.targetPos.copy(this.offset);
    this.targetPos.applyMatrix4(this.snappedXFormWorld);

    if (obj.parent) {
      obj.parent.worldToLocal(this.targetPos);
    }

    if (!this.started) {
      obj.position.copy(this.targetPos);
      this.started = true;
    } else {
      const t = this.data.speed * dt;

      obj.position.set(
        obj.position.x + (this.targetPos.x - obj.position.x) * t,
        obj.position.y + (this.targetPos.y - obj.position.y) * t,
        obj.position.z + (this.targetPos.z - obj.position.z) * t
      );
    }

    this.snappedXFormWorld.decompose(this.tempVector, obj.quaternion, this.tempVector);
    obj.matrixNeedsUpdate = true;
  },

  _applyMaskedTargetRotation(x, y, z, to) {
    const target = this.data.target.object3D;
    this.snappedRot.set(x, y, z, target.rotation.order);
    this.snappedQ.setFromEuler(this.snappedRot);

    this.snappedXForm.compose(
      target.position,
      this.snappedQ,
      target.scale
    );

    to.multiplyMatrices(target.parent.matrixWorld, this.snappedXForm);
  }
});
