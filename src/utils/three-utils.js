const tempVector3 = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();

export function getLastWorldPosition(src, target) {
  target.setFromMatrixPosition(src.matrixWorld);
  return target;
}

export function getLastWorldQuaternion(src, target) {
  src.matrixWorld.decompose(tempVector3, target, tempVector3);
  return target;
}

export function getLastWorldScale(src, target) {
  src.matrixWorld.decompose(tempVector3, tempQuaternion, target);
  return target;
}
