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
    this.el.sceneEl.addEventListener(
      this.data.on,
      this.updateOffset.bind(this)
    );
  },
  updateOffset() {
    const offsetVector = new THREE.Vector3().copy(this.data.offset);
    this.data.target.object3D.localToWorld(offsetVector);
    this.el.setAttribute("position", offsetVector);

    const headWorldRotation = this.data.target.object3D.getWorldRotation();
    this.el.setAttribute("rotation", {
      x: headWorldRotation.x * THREE.Math.RAD2DEG,
      y: headWorldRotation.y * THREE.Math.RAD2DEG,
      z: headWorldRotation.z * THREE.Math.RAD2DEG
    });
  }
});
