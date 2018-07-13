export function getBox(entity) {
  const box = new THREE.Box3();
  const mesh = entity.getObject3D("mesh");
  const rotation = entity.object3D.rotation.clone();
  entity.object3D.rotation.set(0, 0, 0);
  entity.object3D.updateMatrixWorld(true);

  box.expandByObject = expandByObject;
  box.setFromObject(mesh);
  entity.object3D.rotation.copy(rotation);
  return box;
}

export function getCenterAndHalfExtents(entity, box, center, halfExtents) {
  const { min, max } = box;
  center.addVectors(min, max).multiplyScalar(0.5);
  entity.object3D.worldToLocal(center);
  halfExtents
    .copy(min)
    .negate()
    .add(max)
    .multiplyScalar(0.5 / entity.object3D.scale.x);
}

export function getScaleCoefficient(length, box) {
  const { max, min } = box;
  const dX = Math.abs(max.x - min.x);
  const dY = Math.abs(max.y - min.y);
  const dZ = Math.abs(max.z - min.z);
  const lengthOfLongestComponent = Math.max(dX, dY, dZ);
  return length / lengthOfLongestComponent;
}

const expandByObject = (function() {
  // Computes the world-axis-aligned bounding box of an object (including its children),
  // accounting for both the object's, and children's, world transforms

  var scope, i, l;

  var v1 = new THREE.Vector3();

  function traverse(node) {
    var geometry = node.geometry;

    if (geometry !== undefined) {
      if (geometry.isGeometry) {
        var vertices = geometry.vertices;

        for (i = 0, l = vertices.length; i < l; i++) {
          v1.copy(vertices[i]);
          v1.applyMatrix4(node.matrixWorld);

          scope.expandByPoint(v1);
        }
      } else if (geometry.isBufferGeometry) {
        var attribute = geometry.attributes.position;

        if (attribute !== undefined) {
          for (i = 0, l = attribute.count; i < l; i++) {
            v1.fromBufferAttribute(attribute, i).applyMatrix4(node.matrixWorld);
            if (isNaN(v1.x) || isNaN(v1.y) || isNaN(v1.z)) {
              continue;
            }

            scope.expandByPoint(v1);
          }
        }
      }
    }
  }

  return function expandByObject(object) {
    scope = this;

    object.traverse(traverse);

    return this;
  };
})();
