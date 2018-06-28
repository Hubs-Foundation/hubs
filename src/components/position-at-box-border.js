const PI = Math.PI;
const PI_HALF = PI / 2;
const THREE_PI_HALF = 3 * PI / 2;
const right = new THREE.Vector3(1, 0, 0);
const forward = new THREE.Vector3(0, 0, 1);
const left = new THREE.Vector3(-1, 0, 0);
const back = new THREE.Vector3(0, 0, -1);
const dirs = [left, right, forward, back];
const rotations = [THREE_PI_HALF, PI_HALF, 0, PI];

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

    let minSquareDistance = Infinity;
    const targetInfo = {
      dir: dirs[0],
      halfExtent: halfExtentDirs[0],
      rotation: rotations[0]
    };

    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i];
      const pointOnBoxFace = dir.clone().multiplyScalar(halfExtentDirs[i]);
      this.el.object3D.localToWorld(pointOnBoxFace);
      const squareDistance = pointOnBoxFace.distanceToSquared(this.camWorldPos);
      if (squareDistance < minSquareDistance) {
        minSquareDistance = squareDistance;
        targetInfo.dir = dir;
        targetInfo.halfExtent = halfExtentDirs[i];
        targetInfo.rotation = rotations[i];
      }
    }

    this.target.position.copy(
      targetInfo.dir
        .clone()
        .multiplyScalar(targetInfo.halfExtent)
        .add(this.shape.data.offset)
    );
    this.target.rotation.set(0, targetInfo.rotation, 0);
  }
});
