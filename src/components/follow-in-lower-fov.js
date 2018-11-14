AFRAME.registerComponent("follow-in-lower-fov", {
  schema: {
    target: { type: "selector" },
    offset: { type: "vec3" },
    speed: { type: "number", default: 0.005 }
  },

  init() {
    this.targetPos = new THREE.Vector3();
    this.offset = new THREE.Vector3();
    this.offset.copy(this.data.offset);

    this.snappedRot = new THREE.Euler();
    this.snappedQ = new THREE.Quaternion();
    this.snappedXForm = new THREE.Matrix4();
    this.snappedXFormWorld = new THREE.Matrix4();
  },

  tick(t, dt) {
    const obj = this.el.object3D;
    const target = this.data.target.object3D;
    this.snappedRot.set(-Math.PI / 4, target.rotation.y, target.rotation.z, target.rotation.order);

    this.snappedQ.setFromEuler(this.snappedRot);
    this.snappedXForm.compose(
      target.position,
      this.snappedQ,
      target.scale
    );
    this.snappedXFormWorld.multiplyMatrices(target.parent.matrixWorld, this.snappedXForm);

    this.targetPos.copy(this.offset);
    this.targetPos.applyMatrix4(this.snappedXFormWorld);

    if (obj.parent) {
      obj.parent.worldToLocal(this.targetPos);
    }

    if (!this.started) {
      obj.position.copy(this.targetPos);
      this.started = true;
    } else {
      obj.position.set(
        obj.position.x + (this.targetPos.x - obj.position.x) * this.data.speed * dt,
        obj.position.y + (this.targetPos.y - obj.position.y) * this.data.speed * dt,
        obj.position.z + (this.targetPos.z - obj.position.z) * this.data.speed * dt
      );
    }

    // TODO mask out local X, Z rotation
    target.getWorldQuaternion(obj.quaternion);
  }
});
