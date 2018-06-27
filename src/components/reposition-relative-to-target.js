AFRAME.registerComponent("reposition-relative-to-target", {
  schema: {
    on: { type: "string" },
    target: { type: "selector" },
    offset: { type: "vec3" }
  },

  init() {
    this.reposition = this.reposition.bind(this);
    if (this.data.on) {
      this.el.addEventListener(this.data.on, this.reposition);
    } else {
      this.reposition();
    }
  },

  reposition() {
    const obj = this.el.object3D;
    const target = this.data.target.object3D;
    const position = new THREE.Vector3().copy(this.data.offset);
    target.localToWorld(position);
    obj.position.copy(position);
    target.getWorldQuaternion(obj.quaternion);

    this.el.removeEventListener(this.data.on, this.reposition);
    this.el.removeAttribute("reposition-relative-to-target");
  }
});
