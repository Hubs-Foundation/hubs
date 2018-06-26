const PI_HALF = Math.PI / 2;
const right = new THREE.Vector3(1, 0, 0);
const forward = new THREE.Vector3(0, 0, 1);
const left = new THREE.Vector3(-1, 0, 0);
const back = new THREE.Vector3(0, 0, -1);
function almostEquals(u, v, eps) {
  return Math.abs(u.x - v.x) < eps && Math.abs(u.y - v.y) < eps && Math.abs(u.z - v.z) < eps;
}

AFRAME.registerComponent("position-at-box-border", {
  dependencies: ["shape"],
  schema: {
    target: { type: "string" }
  },

  init() {
    window.p = this;
    this.body = this.el.components["shape"];
    this.position = new THREE.Vector3();
    this.prevScale = new THREE.Vector3(-1, -1, -1);
    this.rotation = this.el.object3D.rotation.clone();
    this.el.addEventListener("model-loaded", () => {
      this.modelLoaded = true;
      this.target = this.el.querySelector(this.data.target).object3D;
    });
    this.worldPos = new THREE.Vector3();
    this.cam = document.querySelector("[camera]").object3D;
    this.camWorldPos = new THREE.Vector3();
  },

  tick() {
    if (!this.modelLoaded) return;
    if (!this.target) {
      console.log("uh oh");
      this.target = this.el.querySelector(this.data.target).object3D;
    }

    const scale = this.el.object3D.scale;
    if (!almostEquals(scale, this.prevScale, 0.001)) {
      this.target.scale.set(1 / (2 * scale.x), 1 / (2 * scale.y), 1 / (2 * scale.z));
      this.prevScale.copy(scale);
    }

    this.el.object3D.getWorldPosition(this.worldPos);
    this.cam.getWorldPosition(this.camWorldPos);

    const halfExtents = this.body.data.halfExtents;
    const dirs = [left, right, forward, back];
    const rotations = [3 * PI_HALF, PI_HALF, 0, 2 * PI_HALF];
    const halfExtentDirs = [halfExtents.x, halfExtents.x, halfExtents.z, halfExtents.z];
    let minDistance = Infinity;
    let minDir = left;
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
        .add(this.body.data.offset)
    );
    // this.lookTarget = minDir.clone().multiplyScalar(30000);
    // this.el.object3D.localToWorld(this.lookTarget);
    this.target.rotation.set(0, minRotation, 0);
  }
});
