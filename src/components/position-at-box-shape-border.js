const PI = Math.PI;
const HALF_PI = PI / 2;
const THREE_HALF_PI = 3 * PI / 2;
const right = new THREE.Vector3(1, 0, 0);
const forward = new THREE.Vector3(0, 0, 1);
const left = new THREE.Vector3(-1, 0, 0);
const back = new THREE.Vector3(0, 0, -1);
const dirs = {
  left: {
    dir: left,
    rotation: THREE_HALF_PI,
    halfExtent: "x"
  },
  right: {
    dir: right,
    rotation: HALF_PI,
    halfExtent: "x"
  },
  forward: {
    dir: forward,
    rotation: 0,
    halfExtent: "z"
  },
  back: {
    dir: back,
    rotation: PI,
    halfExtent: "z"
  }
};

AFRAME.registerComponent("position-at-box-shape-border", {
  schema: {
    target: { type: "string" },
    dirs: { default: ["left", "right", "forward", "back"] }
  },

  init() {
    this.cam = this.el.sceneEl.camera.el.object3D;
  },

  update() {
    this.dirs = this.data.dirs.map(d => dirs[d]);
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
      this.cam.getWorldPosition(camWorldPos);

      let minSquareDistance = Infinity;
      let targetDir = this.dirs[0].dir;
      let targetHalfExtent = halfExtents[this.dirs[0].halfExtent];
      let targetRotation = this.dirs[0].rotation;

      for (let i = 0; i < this.dirs.length; i++) {
        const dir = this.dirs[i].dir;
        const halfExtent = halfExtents[this.dirs[i].halfExtent];
        pointOnBoxFace.copy(dir).multiplyScalar(halfExtent);
        this.el.object3D.localToWorld(pointOnBoxFace);
        const squareDistance = pointOnBoxFace.distanceToSquared(camWorldPos);
        if (squareDistance < minSquareDistance) {
          minSquareDistance = squareDistance;
          targetDir = dir;
          targetHalfExtent = halfExtent;
          targetRotation = this.dirs[i].rotation;
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
