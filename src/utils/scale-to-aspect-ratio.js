export function scaleMeshToAspectRatio(mesh, ratio) {
  const width = Math.min(1.0, 1.0 / ratio);
  const height = Math.min(1.0, ratio);
  mesh.scale.set(width, height, 1);
  mesh.matrixNeedsUpdate = true;
}

export function scaleToAspectRatio(el, ratio) {
  scaleMeshToAspectRatio(el.object3DMap.mesh, ratio);
}
