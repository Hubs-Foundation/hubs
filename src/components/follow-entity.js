AFRAME.registerComponent("follow-entity", {
  schema: {
    target: { type: "selector" },
    offset: { type: "vec3" },
    fixedY: { type: "number" }
  },

  init() {
    this.targetPos = new THREE.Vector3();
    this.offset = new THREE.Vector3();
    this.offset.copy(this.data.offset);
  },

  tick(t, dt) {
    const obj = this.el.object3D;
    const target = this.data.target.object3D;

    this.targetPos.copy(this.offset);
    target.localToWorld(this.targetPos);

    if (obj.parent) {
      obj.parent.worldToLocal(this.targetPos);
    }

    if (this.data.fixedY) {
      this.targetPos.y = this.data.fixedY;
    }

    if (!this.started) {
      obj.position.copy(this.targetPos);
      this.started = true;
    } else {
      obj.position.set(
        obj.position.x + (this.targetPos.x - obj.position.x) * 0.0005 * dt,
        obj.position.y + (this.targetPos.y - obj.position.y) * 0.0005 * dt,
        obj.position.z + (this.targetPos.z - obj.position.z) * 0.0005 * dt
      );
    }

    target.getWorldQuaternion(obj.quaternion);
  }
});
