AFRAME.registerComponent("auto-box-collider", {
  schema: {
    setInitialScale: { default: false }
  },
  init() {
    this.onLoaded = this.onLoaded.bind(this);
    this.el.addEventListener("model-loaded", this.onLoaded);
    window.autobox = this;
  },
  onLoaded() {
    this.el.removeEventListener("model-loaded", this.onLoaded);
    const initialRotation = this.el.object3D.rotation.clone();
    const initialScale = this.el.object3D.scale.clone();
    const { min, max } = new THREE.Box3().setFromObject(this.el.object3DMap.mesh);
    this.el.setAttribute("rotation", { x: 0, y: 0, z: 0 });
    let halfExtents = new THREE.Vector3().addVectors(min.negate(), max).multiplyScalar(0.5);
    this.el.setAttribute("shape", {
      shape: "box",
      halfExtents: halfExtents.multiplyScalar(1 / initialScale.x),
      offset: new THREE.Vector3(0, halfExtents.y, 0)
    });
    if (this.data.setInitialScale) {
      this.setInitialScale();
    }
    this.el.setAttribute("rotation", initialRotation);
  },
  // Adjust the scale such that the object fits within a box whose longest component axis is lengthOfLongestComponent meters.
  // In other words, a tall model will be scaled down to be only half a meter tall, a wide model will be scaled down to be only
  // half a meter wide, a long model will be scaled down to be only half a meter long.
  setInitialScale() {
    const worldBox = new THREE.Box3().setFromObject(this.el.object3DMap.mesh);
    const dX = Math.abs(worldBox.max.x - worldBox.min.x);
    const dY = Math.abs(worldBox.max.y - worldBox.min.y);
    const dZ = Math.abs(worldBox.max.z - worldBox.min.z);
    const max = Math.max(dX, dY, dZ);
    const scale = this.el.object3D.scale;
    const lengthOfLongestComponent = 0.5;
    const correctiveFactor = lengthOfLongestComponent / max;
    this.el.setAttribute("scale", {
      x: scale.x * correctiveFactor,
      y: scale.y * correctiveFactor,
      z: scale.z * correctiveFactor
    });
  }
});
