import { squareDistanceBetween } from "../utils/three-utils";
AFRAME.registerComponent("scale-in-screen-space", {
  schema: {
    baseScale: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    addedScale: { type: "vec3", default: { x: 1, y: 1, z: 1 } }
  },
  tick: (function() {
    const parentScale = new THREE.Vector3();
    return function tick() {
      this.viewingCamera = this.viewingCamera || document.getElementById("viewing-camera");
      const distance = Math.sqrt(squareDistanceBetween(this.el.object3D, this.viewingCamera.object3D));
      const parent = this.el.object3D.parent;
      parent.updateMatrices();
      parentScale.setFromMatrixScale(parent.matrixWorld);
      this.el.object3D.scale.set(
        (1 / parentScale.x) * (this.data.baseScale.x + distance * this.data.addedScale.x),
        (1 / parentScale.y) * (this.data.baseScale.y + distance * this.data.addedScale.y),
        (1 / parentScale.z) * (this.data.baseScale.z + distance * this.data.addedScale.z)
      );
      this.el.object3D.matrixNeedsUpdate = true;
    };
  })()
});
