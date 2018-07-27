const rotation = new THREE.Euler();
export function getBox(entity, boxRoot) {
  const box = new THREE.Box3();
  rotation.copy(entity.object3D.rotation);
  entity.object3D.rotation.set(0, 0, 0);
  entity.object3D.updateMatrixWorld(true);
  box.setFromObject(boxRoot);
  entity.object3D.worldToLocal(box.min);
  entity.object3D.worldToLocal(box.max);
  entity.object3D.rotation.copy(rotation);
  return box;
}

export function getScaleCoefficient(length, box) {
  const { max, min } = box;
  const dX = Math.abs(max.x - min.x);
  const dY = Math.abs(max.y - min.y);
  const dZ = Math.abs(max.z - min.z);
  const lengthOfLongestComponent = Math.max(dX, dY, dZ);
  return length / lengthOfLongestComponent;
}
