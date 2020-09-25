import { setMatrixWorld } from "../utils/three-utils";
const rotate = new THREE.Matrix4().makeRotationY(Math.PI);
const m = new THREE.Matrix4();
// ugly hack
AFRAME.registerComponent("rotate-180", {
  tick() {
    this.el.object3D.parent.updateMatrices();
    setMatrixWorld(this.el.object3D, m.copy(this.el.object3D.parent.matrixWorld).multiply(rotate));
  }
});
