export function scaleToAspectRatio(el, ratio) {
  const width = Math.min(1.0, 1.0 / ratio);
  const height = Math.min(1.0, ratio);
  el.object3DMap.mesh.scale.set(width, height, 1);
  el.object3DMap.mesh.matrixNeedsUpdate = true;
}
