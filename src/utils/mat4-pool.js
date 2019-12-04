const mat4Pool = [];
export function getPooledMatrix4() {
  return mat4Pool.shift() || new THREE.Matrix4();
}
export function freePooledMatrix4(mat4) {
  mat4Pool.push(mat4);
}
