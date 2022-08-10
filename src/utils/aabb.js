import { setMatrixWorld } from "../utils/three-utils";
let p = new THREE.Vector3();
let q = new THREE.Quaternion();
let s = new THREE.Vector3();
let identity = new THREE.Matrix4().compose(
  new THREE.Vector3().setScalar(0),
  new THREE.Quaternion().identity(),
  new THREE.Vector3().setScalar(1)
);
export function aabb(obj, box) {
  // Save current transform
  obj.updateMatrices();
  obj.matrix.decompose(p, q, s);

  // Reset transform
  setMatrixWorld(obj, identity);
  obj.updateMatrices();

  // Expand box
  box.setFromObject(obj);

  // Restore transform
  obj.position.copy(p);
  obj.quaternion.copy(q);
  obj.scale.copy(s);
  obj.matrixNeedsUpdate = true;
  obj.updateMatrices();
}
