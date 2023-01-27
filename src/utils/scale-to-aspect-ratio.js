export function scaleToAspectRatio(el, ratio) {
  const obj = el.object3DMap.mesh;
  const width = Math.min(1.0, 1.0 / ratio);
  const height = Math.min(1.0, ratio);
  obj.scale.set(width, height, 1);
  obj.matrixNeedsUpdate = true;
}
