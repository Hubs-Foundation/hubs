AFRAME.registerComponent("offset-relative-to", {
  schema: {
    target: {
      type: "selector"
    },
    offset: {
      type: "vec3"
    },
    on: {
      type: "string"
    }
  },
  init() {
    this.updateOffset();
    this.el.sceneEl.addEventListener(this.data.on, this.updateOffset.bind(this));
  },
  updateOffset() {
    const offsetVector = new THREE.Vector3().copy(this.data.offset);
    this.data.target.object3D.localToWorld(offsetVector);
    this.el.setAttribute("position", offsetVector);
    this.data.target.object3D.getWorldQuaternion(this.el.object3D.quaternion);
  }
});
