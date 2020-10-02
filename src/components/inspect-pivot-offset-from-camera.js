import { setMatrixWorld, affixToWorldUp } from "../utils/three-utils";
const rotate = new THREE.Matrix4().makeRotationY(Math.PI);
const translate = new THREE.Matrix4().makeTranslation(0, -0.25, 0);
const m = new THREE.Matrix4();

AFRAME.registerComponent("inspect-pivot-offset-from-camera", {
  tick() {
    const parent = this.el.object3D.parent;
    parent.updateMatrices();
    setMatrixWorld(
      this.el.object3D,
      affixToWorldUp(parent.matrixWorld, m)
        .multiply(translate)
        .multiply(rotate)
    );
  }
});
