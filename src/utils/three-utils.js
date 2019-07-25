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

export const positionRigSuchThatCameraIsInFrontOfObject = (function() {
  const r = new THREE.Vector3();
  const rq = new THREE.Quaternion();
  const c = new THREE.Vector3();
  const cq = new THREE.Quaternion();
  const o = new THREE.Vector3();
  const o2 = new THREE.Vector3();
  const oq = new THREE.Quaternion();
  const coq = new THREE.Quaternion();
  const q = new THREE.Quaternion();

  const cp = new THREE.Vector3();
  const op = new THREE.Vector3();
  const v = new THREE.Vector3();
  const p = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  return function positionRigSuchThatCameraIsInFrontOfObject(rig, camera, object) {
    // assume
    //  - camera is rig's child
    //  - scales are 1
    //  - object is not flat on the floor
    rig.getWorldQuaternion(rq);
    camera.getWorldQuaternion(cq);
    object.getWorldQuaternion(oq);

    r.set(0, 0, 1)
      .applyQuaternion(rq) //     .projectOnPlane(UP) // not needed here since rig is assumed flat
      .normalize();

    c.set(0, 0, -1)
      .applyQuaternion(cq)
      .projectOnPlane(UP)
      .normalize();

    o.set(0, 0, -1).applyQuaternion(oq);
    o2.copy(o)
      .projectOnPlane(UP)
      .normalize();

    coq.setFromUnitVectors(c, o2);
    q.copy(rq).premultiply(coq);

    cp.copy(camera.position);
    object.getWorldPosition(op);
    v.copy(cp).multiplyScalar(-1);
    p.copy(op)
      .sub(o2)
      .sub(new THREE.Vector3(0, o.y / 2, 0))
      .add(v);

    rig.quaternion.copy(q);
    rig.position.copy(p);
    rig.matrixNeedsUpdate = true;
  };
})();
