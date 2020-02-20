// Computes an AABB that surrounds the object in question and all of its children.
// Note that if the children have rotations, this probably won't return the tightest
// possible AABB -- we could return a tighter one if we examined all of the vertices
// of the geometry for ourselves, but we don't care enough for what we're using this
// for to do so much work.
export const computeObjectAABB = (function() {
  const bounds = new THREE.Box3();
  return function(root, target) {
    target.makeEmpty();
    root.traverse(node => {
      node.updateMatrices();
      const geometry = node.geometry;
      if (geometry != null) {
        if (geometry.boundingBox == null) {
          geometry.computeBoundingBox();
        }
        target.union(bounds.copy(geometry.boundingBox).applyMatrix4(node.matrixWorld));
      }
    });
    return target;
  };
})();

const rotation = new THREE.Euler();
export function getBox(entity, boxRoot, worldSpace) {
  const box = new THREE.Box3();

  rotation.copy(entity.object3D.rotation);
  entity.object3D.rotation.set(0, 0, 0);

  entity.object3D.updateMatrices(true, true);
  boxRoot.updateMatrices(true, true);
  boxRoot.updateMatrixWorld(true);

  computeObjectAABB(boxRoot, box);

  if (!box.isEmpty()) {
    if (!worldSpace) {
      entity.object3D.worldToLocal(box.min);
      entity.object3D.worldToLocal(box.max);
    }
    entity.object3D.rotation.copy(rotation);
    entity.object3D.matrixNeedsUpdate = true;
  }

  boxRoot.matrixWorldNeedsUpdate = true;
  boxRoot.updateMatrices();

  return box;
}

export function getScaleCoefficient(length, box) {
  if (box.isEmpty()) return 1.0;

  const { max, min } = box;
  const dX = Math.abs(max.x - min.x);
  const dY = Math.abs(max.y - min.y);
  const dZ = Math.abs(max.z - min.z);
  const lengthOfLongestComponent = Math.max(dX, dY, dZ);
  return length / lengthOfLongestComponent;
}
