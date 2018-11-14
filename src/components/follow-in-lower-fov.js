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
  },

  tick(t, dt) {
    const obj = this.el.object3D;
    const target = this.data.target.object3D;

    const snappedRot = new THREE.Euler(-Math.PI / 4, target.rotation.y, 0, target.rotation.order);

    const snappedQ = new THREE.Quaternion();
    snappedQ.setFromEuler(snappedRot);
    const snappedXForm = new THREE.Matrix4();
    const snappedXFormWorld = new THREE.Matrix4();
    snappedXForm.compose(
      target.position,
      snappedQ,
      target.scale
    );
    snappedXFormWorld.multiplyMatrices(target.parent.matrixWorld, snappedXForm);

    this.targetPos.copy(this.offset);
    this.targetPos.applyMatrix4(snappedXFormWorld);

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

    target.getWorldQuaternion(obj.quaternion);
  }
});
