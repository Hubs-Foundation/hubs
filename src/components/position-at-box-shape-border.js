const PI = Math.PI;
const HALF_PI = PI / 2;
const THREE_HALF_PI = 3 * PI / 2;
const rotations = [THREE_HALF_PI, HALF_PI, 0, PI];
const right = new THREE.Vector3(1, 0, 0);
const forward = new THREE.Vector3(0, 0, 1);
const left = new THREE.Vector3(-1, 0, 0);
const back = new THREE.Vector3(0, 0, -1);
const dirs = [left, right, forward, back];

AFRAME.registerComponent("position-at-box-shape-border", {
  schema: {
    target: { type: "string" }
  },

  init() {
    this.cam = this.el.sceneEl.camera.el.object3D;
  },

  tick: (function() {
    const camWorldPos = new THREE.Vector3();
    const targetPosition = new THREE.Vector3();
    const pointOnBoxFace = new THREE.Vector3();
    return function() {
      if (!this.shape) {
        this.shape = this.el.components["shape"];
        if (!this.shape) return;
      }
      if (!this.target) {
        this.target = this.el.querySelector(this.data.target).object3D;
        if (!this.target) return;
      }
      const halfExtents = this.shape.data.halfExtents;
      const halfExtentDirs = ["x", "x", "z", "z"];
      this.cam.getWorldPosition(camWorldPos);

      let minSquareDistance = Infinity;
      let targetDir = dirs[0];
      let targetHalfExtent = halfExtents[halfExtentDirs[0]];
      let targetRotation = rotations[0];

      for (let i = 0; i < dirs.length; i++) {
        const dir = dirs[i];
        const halfExtent = halfExtents[halfExtentDirs[i]];
        pointOnBoxFace.copy(dir).multiplyScalar(halfExtent);
        this.el.object3D.localToWorld(pointOnBoxFace);
        const squareDistance = pointOnBoxFace.distanceToSquared(camWorldPos);
        if (squareDistance < minSquareDistance) {
          minSquareDistance = squareDistance;
          targetDir = dir;
          targetHalfExtent = halfExtent;
          targetRotation = rotations[i];
        }
      }

      this.target.position.copy(
        targetPosition
          .copy(targetDir)
          .multiplyScalar(targetHalfExtent)
          .add(this.shape.data.offset)
      );
      this.target.rotation.set(0, targetRotation, 0);
    };
  })()
});
