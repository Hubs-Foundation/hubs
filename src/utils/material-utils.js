export function forEachMaterial(object3D, fn) {
  if (!object3D.material) return;

  if (Array.isArray(object3D.material)) {
    object3D.material.forEach(fn);
  } else {
    fn(object3D.material);
  }
}

export function mapMaterials(object3D, fn) {
  if (!object3D.material) return;

  if (Array.isArray(object3D.material)) {
    return object3D.material.map(fn);
  } else {
    return fn(object3D.material);
  }
}
