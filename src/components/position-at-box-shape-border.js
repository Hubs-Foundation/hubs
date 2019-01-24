import { getBox } from "../utils/auto-box-collider.js";
import { getLastWorldPosition } from "../utils/three-utils";

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
  multiple: true,
  schema: {
    target: { type: "string" },
    dirs: { default: ["left", "right", "forward", "back"] },
    animate: { default: true },
    scale: { default: true }
  },

  init() {
    this.cam = this.el.sceneEl.camera.el.object3D;
    this._updateBox = this._updateBox.bind(this);
    this.halfExtents = new THREE.Vector3();
    this.el.sceneEl.systems["frame-scheduler"].schedule(this._updateBox, "media-components");
  },

  remove() {
    this.el.sceneEl.systems["frame-scheduler"].unschedule(this._updateBox, "media-components");
  },

  update() {
    this.dirs = this.data.dirs.map(d => dirs[d]);
  },

  tick() {
    if (!this.target) {
      this.targetEl = this.el.querySelector(this.data.target);
      this.target = this.targetEl.object3D;

      this.targetEl.addEventListener("animationcomplete", () => {
        this.targetEl.removeAttribute("animation__show");
      });

      this.target.scale.setScalar(0.01); // To avoid "pop" of gigantic button first time
      this.target.matrixNeedsUpdate = true;
      return;
    }

    if (!this.el.getObject3D("mesh")) {
      return;
    }

    const isVisible = this.targetEl.getAttribute("visible");
    const opening = isVisible && !this.wasVisible;
    const scaleChanged =
      this.el.object3D.scale.x !== this.previousScaleX ||
      this.el.object3D.scale.y !== this.previousScaleY ||
      this.el.object3D.scale.z !== this.previousScaleZ;
    const isAnimating = this.targetEl.getAttribute("animation__show");

    // If the target is being shown or the scale changed while the opening animation is being run,
    // we need to start or re-start the animation.
    if (opening || (scaleChanged && isAnimating)) {
      this._updateBox(this.data.animate);
    }

    this.wasVisible = isVisible;
    this.previousScaleX = this.el.object3D.scale.x;
    this.previousScaleY = this.el.object3D.scale.y;
    this.previousScaleZ = this.el.object3D.scale.z;
  },

  _updateBox: (function() {
    const camWorldPos = new THREE.Vector3();
    const targetPosition = new THREE.Vector3();
    const pointOnBoxFace = new THREE.Vector3();
    const tempParentWorldScale = new THREE.Vector3();

    return function(animate) {
      if (!this.halfExtents || this.mesh !== this.el.getObject3D("mesh") || this.shape !== this.el.components.shape) {
        this.mesh = this.el.getObject3D("mesh");
        this.shape = this.el.components.shape;

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
      getLastWorldPosition(this.cam, camWorldPos);

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

      tempParentWorldScale.setFromMatrixScale(this.target.parent.matrixWorld);

      const distance = Math.sqrt(minSquareDistance);
      const scale = this.halfExtents[inverseHalfExtents[targetHalfExtentStr]] * distance;
      const targetScale = Math.min(2.0, Math.max(0.5, scale * tempParentWorldScale.x));
      const finalScale = this.data.scale ? targetScale / tempParentWorldScale.x : 1;

      if (animate) {
        this.targetEl.removeAttribute("animation__show");

        this.targetEl.setAttribute("animation__show", {
          property: "scale",
          dur: 300,
          from: { x: finalScale * 0.8, y: finalScale * 0.8, z: finalScale * 0.8 },
          to: { x: finalScale, y: finalScale, z: finalScale },
          easing: "easeOutElastic"
        });
      } else if (!this.targetEl.getAttribute("animation__show")) {
        this.target.scale.setScalar(finalScale);
      }

      this.target.matrixNeedsUpdate = true;
    };
  })()
});
