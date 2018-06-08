AFRAME.registerComponent("auto-box-collider", {
  schema: {
    setInitialScale: { default: false }
  },

  init() {
    this.onLoaded = this.onLoaded.bind(this);
    this.el.addEventListener("model-loaded", this.onLoaded);
  },

  onLoaded() {
    this.el.removeEventListener("model-loaded", this.onLoaded);
    if (this.data.setInitialScale) {
      this.setInitialScale();
    }

    const initialRotation = this.el.object3D.rotation.clone();
    this.el.setAttribute("rotation", { x: 0, y: 0, z: 0 });

    const worldBox = new THREE.Box3().setFromObject(this.el.object3D);
    const dX = Math.abs(worldBox.max.x - worldBox.min.x);
    const dY = Math.abs(worldBox.max.y - worldBox.min.y);
    const dZ = Math.abs(worldBox.max.z - worldBox.min.z);
    const scale = this.el.getAttribute("scale");
    const inverseScale = { x: 1 / scale.x, y: 1 / scale.y, z: 1 / scale.z };

    const localHalfExtents = {
      x: dX * 0.5 * inverseScale.x,
      y: dY * 0.5 * inverseScale.y,
      z: dZ * 0.5 * inverseScale.z
    };
    const center = new THREE.Vector3().addVectors(worldBox.min, worldBox.max).multiplyScalar(0.5);
    const worldPosition = new THREE.Vector3();
    this.el.object3D.getWorldPosition(worldPosition);
    const localOffset = {
      x: (center.x - worldPosition.x) * inverseScale.x,
      y: (center.y - worldPosition.y) * inverseScale.y,
      z: (center.z - worldPosition.z) * inverseScale.z
    };

    // Set the shape component halfExtents
    this.el.setAttribute("shape", {
      shape: "box",
      halfExtents: localHalfExtents,
      offset: localOffset
    });

    this.el.setAttribute("rotation", initialRotation);
  },

  // Adjust the scale such that the object fits within a box whose longest component axis is lengthOfLongestComponent meters.
  // In other words, a tall model will be scaled down to be only half a meter tall, a wide model will be scaled down to be only
  // half a meter wide, a long model will be scaled down to be only half a meter long.
  setInitialScale() {
    const worldBox = new THREE.Box3().setFromObject(this.el.object3D);
    const dX = Math.abs(worldBox.max.x - worldBox.min.x);
    const dY = Math.abs(worldBox.max.y - worldBox.min.y);
    const dZ = Math.abs(worldBox.max.z - worldBox.min.z);
    const max = Math.max(dX, dY, dZ);
    const scale = this.el.getAttribute("scale");
    const lengthOfLongestComponent = 0.5;
    const correctiveFactor = lengthOfLongestComponent / max;
    this.el.setAttribute("scale", {
      x: scale.x * correctiveFactor,
      y: scale.y * correctiveFactor,
      z: scale.z * correctiveFactor
    });
  }
});
