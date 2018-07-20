AFRAME.registerComponent("auto-box-collider", {
  schema: {
    resize: { default: false },
    resizeLength: { default: 0.5 }
  },

  init() {
    this.onLoaded = this.onLoaded.bind(this);
    this.el.addEventListener("model-loaded", this.onLoaded);
  },

  remove() {
    this.el.removeEventListener("model-loaded", this.onLoaded);
  },

  onLoaded() {
    const rotation = this.el.object3D.rotation.clone();
    this.el.object3D.rotation.set(0, 0, 0);
    const { min, max } = new THREE.Box3().setFromObject(this.el.object3DMap.mesh);
    const halfExtents = new THREE.Vector3()
      .addVectors(min.clone().negate(), max)
      .multiplyScalar(0.5 / this.el.object3D.scale.x);
    this.el.setAttribute("shape", {
      shape: "box",
      halfExtents: halfExtents,
      offset: new THREE.Vector3(0, halfExtents.y, 0)
    });
    if (this.data.resize) {
      this.resize(min, max);
    }
    this.el.object3D.rotation.copy(rotation);
    this.el.removeAttribute("auto-box-collider");
  },

  // Adjust the scale such that the object fits within a box of a specified size.
  resize(min, max) {
    const dX = Math.abs(max.x - min.x);
    const dY = Math.abs(max.y - min.y);
    const dZ = Math.abs(max.z - min.z);
    const lengthOfLongestComponent = Math.max(dX, dY, dZ);
    const correctiveFactor = this.data.resizeLength / lengthOfLongestComponent;
    const scale = this.el.object3D.scale;
    this.el.setAttribute("scale", {
      x: scale.x * correctiveFactor,
      y: scale.y * correctiveFactor,
      z: scale.z * correctiveFactor
    });
  }
});
