const PI = Math.PI;
const PI_HALF = PI / 2;
const THREE_PI_HALF = 3 * PI / 2;
const right = new THREE.Vector3(1, 0, 0);
const forward = new THREE.Vector3(0, 0, 1);
const left = new THREE.Vector3(-1, 0, 0);
const back = new THREE.Vector3(0, 0, -1);
const dirs = [left, right, forward, back];
const rotations = [THREE_PI_HALF, PI_HALF, 0, PI];
function almostEquals(u, v, eps) {
  return Math.abs(u.x - v.x) < eps && Math.abs(u.y - v.y) < eps && Math.abs(u.z - v.z) < eps;
}

AFRAME.registerComponent("position-at-box-border", {
  schema: {
    target: { type: "string" }
  },

  init() {
    this.position = new THREE.Vector3();
    this.prevScale = new THREE.Vector3(-1, -1, -1);
    this.cam = document.querySelector("[camera]").object3D;
    this.camWorldPos = new THREE.Vector3();
  },

  tick() {
    if (!this.shape) {
      this.shape = this.el.components["shape"];
      if (!this.shape) return;
    }
    if (!this.target) {
      this.target = this.el.querySelector(this.data.target).object3D;
      if (!this.target) return;
    }
    const halfExtents = this.shape.data.halfExtents;
    const halfExtentDirs = [halfExtents.x, halfExtents.x, halfExtents.z, halfExtents.z];
    this.cam.getWorldPosition(this.camWorldPos);

    let minDistance = Infinity;
    let minDir = dirs[0];
    let minHalfExtentDir = halfExtentDirs[0];
    let minRotation = rotations[0];
    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i];
      let dirOfObject = dir.clone().multiplyScalar(halfExtentDirs[i]);
      this.el.object3D.localToWorld(dirOfObject);
      const distanceSquared = dirOfObject.distanceToSquared(this.camWorldPos);
      if (distanceSquared < minDistance) {
        minDistance = distanceSquared;
        minDir = dir;
        minHalfExtentDir = halfExtentDirs[i];
        minRotation = rotations[i];
      }
    }

    this.target.position.copy(
      minDir
        .clone()
        .multiplyScalar(minHalfExtentDir)
        .add(this.shape.data.offset)
    );
    this.target.rotation.set(0, minRotation, 0);
  }
});
