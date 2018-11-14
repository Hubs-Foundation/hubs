AFRAME.registerComponent("follow-entity", {
  schema: {
    target: { type: "selector" },
    offset: { type: "vec3" },
    worldYOffset: { type: "number", default: 0.35 },
    speed: { type: "number", default: 0.005 },
    ySnapInterval: { type: "number", default: 0.75 }
  },

  init() {
    this.targetPos = new THREE.Vector3();
    this.offset = new THREE.Vector3();
    this.offset.copy(this.data.offset);
  },

  tick(t, dt) {
    const obj = this.el.object3D;
    const target = this.data.target.object3D;

    const snappedRot = new THREE.Euler(
      Math.floor((target.rotation.x + Math.PI / 6) / (Math.PI / 4)) * (Math.PI / 4),
      target.rotation.y,
      target.rotation.z,
      target.rotation.order
    );

    const snappedQ = new THREE.Quaternion();
    snappedQ.setFromEuler(snappedRot);
    //snappedQ.copy(target.quaternion);
    const snappedXForm = new THREE.Matrix4();
    const snappedXFormWorld = new THREE.Matrix4();
    snappedXForm.compose(
      target.position,
      snappedQ,
      target.scale
    );
    snappedXFormWorld.multiplyMatrices(target.parent.matrixWorld, snappedXForm);
    //snappedXForm.copy(target.matrixWorld);
    //snappedXForm.makeRotationFromEuler(snappedRot);

    this.targetPos.copy(this.offset);
    this.targetPos.applyMatrix4(snappedXFormWorld);
    //target.localToWorld(this.targetPos);

    if (obj.parent) {
      obj.parent.worldToLocal(this.targetPos);
    }

    //this.targetPos.y = this.data.worldYOffset;
    /*this.targetPos.y =
      Math.floor((this.targetPos.y - this.data.ySnapInterval / 2) / this.data.ySnapInterval) * this.data.ySnapInterval +
      this.data.ySnapInterval / 2;*/

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
