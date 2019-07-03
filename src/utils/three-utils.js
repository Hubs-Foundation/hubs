const tempVector3 = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();

export function getLastWorldPosition(src, target) {
  src.updateMatrices();
  target.setFromMatrixPosition(src.matrixWorld);
  return target;
}

export function getLastWorldQuaternion(src, target) {
  src.updateMatrices();
  src.matrixWorld.decompose(tempVector3, target, tempVector3);
  return target;
}

export function getLastWorldScale(src, target) {
  src.updateMatrices();
  src.matrixWorld.decompose(tempVector3, tempQuaternion, target);
  return target;
}

export function disposeMaterial(mtrl) {
  if (mtrl.map) mtrl.map.dispose();
  if (mtrl.lightMap) mtrl.lightMap.dispose();
  if (mtrl.bumpMap) mtrl.bumpMap.dispose();
  if (mtrl.normalMap) mtrl.normalMap.dispose();
  if (mtrl.specularMap) mtrl.specularMap.dispose();
  if (mtrl.envMap) mtrl.envMap.dispose();
  mtrl.dispose();
}

export function disposeNode(node) {
  if (!(node instanceof THREE.Mesh)) return;

  if (node.geometry) {
    node.geometry.dispose();
  }

  if (node.material) {
    let materialArray;
    if (node.material instanceof THREE.MeshFaceMaterial || node.material instanceof THREE.MultiMaterial) {
      materialArray = node.material.materials;
    } else if (node.material instanceof Array) {
      materialArray = node.material;
    }
    if (materialArray) {
      materialArray.forEach(disposeMaterial);
    } else {
      disposeMaterial(node.material);
    }
  }
}

export function setMatrixWorld(object3D, m) {
  object3D.matrixWorld.copy(m);
  object3D.matrix = object3D.matrix.getInverse(object3D.parent.matrixWorld).multiply(object3D.matrixWorld);
  object3D.matrix.decompose(object3D.position, object3D.quaternion, object3D.scale);
}
