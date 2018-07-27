import { getBox } from "../utils/auto-box-collider.js";

const PI = Math.PI;
const HALF_PI = PI / 2;
const THREE_HALF_PI = 3 * HALF_PI;
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

const inverseHalfExtents = {
  x: "z",
  z: "x"
};

AFRAME.registerComponent("position-at-box-shape-border", {
  schema: {
    target: { type: "string" },
    dirs: { default: ["left", "right", "forward", "back"] }
  },

  init() {
    this.cam = this.el.sceneEl.camera.el.object3D;
    this.halfExtents = new THREE.Vector3();
  },

  update() {
    this.dirs = this.data.dirs.map(d => dirs[d]);
  },

  tick: (function() {
    const camWorldPos = new THREE.Vector3();
    const targetPosition = new THREE.Vector3();
    const pointOnBoxFace = new THREE.Vector3();
    return function() {
      if (!this.target) {
        this.target = this.el.querySelector(this.data.target).object3D;
        if (!this.target) return;
      }
      if (!this.el.getObject3D("mesh")) {
        return;
      }
      if (!this.halfExtents || this.mesh !== this.el.getObject3D("mesh") || this.shape !== this.el.components.shape) {
        this.mesh = this.el.getObject3D("mesh");
        if (this.el.components.shape) {
          this.shape = this.el.components.shape;
          this.halfExtents.copy(this.shape.data.halfExtents);
        } else {
          const box = getBox(this.el, this.mesh);
          this.halfExtents = box.min
            .clone()
            .negate()
            .add(box.max)
            .multiplyScalar(0.51 / this.el.object3D.scale.x);
        }
      }
      this.cam.getWorldPosition(camWorldPos);

      let minSquareDistance = Infinity;
      let targetDir = this.dirs[0].dir;
      let targetHalfExtentStr = this.dirs[0].halfExtent;
      let targetHalfExtent = this.halfExtents[targetHalfExtentStr];
      let targetRotation = this.dirs[0].rotation;

      for (let i = 0; i < this.dirs.length; i++) {
        const dir = this.dirs[i].dir;
        const halfExtentStr = this.dirs[i].halfExtent;
        const halfExtent = this.halfExtents[halfExtentStr];
        pointOnBoxFace.copy(dir).multiplyScalar(halfExtent);
        this.el.object3D.localToWorld(pointOnBoxFace);
        const squareDistance = pointOnBoxFace.distanceToSquared(camWorldPos);
        if (squareDistance < minSquareDistance) {
          minSquareDistance = squareDistance;
          targetDir = dir;
          targetHalfExtent = halfExtent;
          targetRotation = this.dirs[i].rotation;
          targetHalfExtentStr = halfExtentStr;
        }
      }

      this.target.position.copy(targetPosition.copy(targetDir).multiplyScalar(targetHalfExtent));
      this.target.rotation.set(0, targetRotation, 0);
      this.target.scale.setScalar(this.halfExtents[inverseHalfExtents[targetHalfExtentStr]] * 4);
    };
  })()
});
