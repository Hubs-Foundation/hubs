function isVisibleUpToRoot(node, root) {
  let child = node;
  while (child) {
    if (child === root) return true;
    if (!child.visible) return false;
    child = child.parent;
  }
  console.error(`Root ${root} is not an ancestor of node ${node}`);
  return false;
}

// HACK Troika Text GlyphGeometry doesn't play nicely with this code. Also it's infinitely thin.
// We don't particularly care about it's bounds, but its important that they are non zero since
// other code checks for that case. Fudge it for now with a very small static box.
const FAKE_TROIKA_BOUNDS = new THREE.Box3(
  new THREE.Vector3(-0.001, -0.001, -0.001),
  new THREE.Vector3(0.001, 0.001, 0.001)
);

// TODO This whole function is suspect for manually computing bounding boxes when geometry already has code for this
export const computeLocalBoundingBox = (function () {
  const vertex = new THREE.Vector3();
  const rootInverse = new THREE.Matrix4();
  const toRootSpace = new THREE.Matrix4();
  return function computeLocalBoundingBox(root, box, excludeInvisible) {
    box.makeEmpty();
    root.updateMatrices();
    rootInverse.copy(root.matrixWorld).invert();
    root.traverse(node => {
      if (excludeInvisible && !isVisibleUpToRoot(node, root)) {
        return;
      }
      node.updateMatrices();
      toRootSpace.multiplyMatrices(rootInverse, node.matrixWorld);
      if (node.geometry) {
        if (node.isTroikaText) {
          box.union(FAKE_TROIKA_BOUNDS);
        } else if (node.geometry.isGeometry) {
          for (let i = 0; i < node.geometry.vertices; i++) {
            vertex.copy(node.geometry.vertices[i]).applyMatrix4(toRootSpace);
            if (isNaN(vertex.x)) continue;
            box.expandByPoint(vertex);
          }
        } else if (node.geometry.isBufferGeometry && node.geometry.attributes.position) {
          const array = node.geometry.attributes.position.array;
          const itemSize = node.geometry.attributes.position.itemSize;
          for (let i = 0; i < node.geometry.attributes.position.count; i++) {
            if (itemSize === 2) {
              vertex.set(array[2 * i], array[2 * i + 1], 0);
            } else if (itemSize === 3) {
              vertex.fromBufferAttribute(node.geometry.attributes.position, i);
            } else {
              return;
            }
            vertex.applyMatrix4(toRootSpace);
            if (isNaN(vertex.x)) continue;
            box.expandByPoint(vertex);
          }
        }
      }
    });
  };
})();

// Computes an AABB that surrounds the object in question and all of its children.
// Note that if the children have rotations, this probably won't return the tightest
// possible AABB -- we could return a tighter one if we examined all of the vertices
// of the geometry for ourselves, but we don't care enough for what we're using this
// for to do so much work.
export const computeObjectAABB = (function () {
  const bounds = new THREE.Box3();
  return function computeObjectAABB(root, target, excludeInvisible) {
    target.makeEmpty();
    root.updateMatrices();
    root.traverse(node => {
      if (excludeInvisible && !isVisibleUpToRoot(node, root)) {
        return;
      }
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
export function getBox(obj, boxRoot, worldSpace) {
  const box = new THREE.Box3();

  rotation.copy(obj.rotation);
  obj.rotation.set(0, 0, 0);

  obj.updateMatrices(true, true);
  boxRoot.updateMatrices(true, true);
  boxRoot.updateMatrixWorld(true);

  computeObjectAABB(boxRoot, box, false);

  if (!box.isEmpty()) {
    if (!worldSpace) {
      obj.worldToLocal(box.min);
      obj.worldToLocal(box.max);
    }
    obj.rotation.copy(rotation);
    obj.matrixNeedsUpdate = true;
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
