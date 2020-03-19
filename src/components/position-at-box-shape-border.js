import { getBox } from "../utils/auto-box-collider.js";
import { getLastWorldPosition } from "../utils/three-utils";
import { CAMERA_MODE_FIRST_PERSON } from "../systems/camera-system";
import { waitForDOMContentLoaded } from "../utils/async-utils";

const PI = Math.PI;
const HALF_PI = PI / 2;
const THREE_HALF_PI = 3 * HALF_PI;
const right = new THREE.Vector3(1, 0, 0);
const forward = new THREE.Vector3(0, 0, 1);
const left = new THREE.Vector3(-1, 0, 0);
const back = new THREE.Vector3(0, 0, -1);
const zero = new THREE.Vector3(0, 0, 0);
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
    this._setupTarget = this._setupTarget.bind(this);
    this.halfExtents = new THREE.Vector3();
    this.el.sceneEl.systems["frame-scheduler"].schedule(this._updateBox, "media-components");

    this._setupTarget();
  },

  remove() {
    this.el.sceneEl.systems["frame-scheduler"].unschedule(this._updateBox, "media-components");
  },

  update() {
    this.dirs = this.data.dirs.map(d => dirs[d]);
  },

  async _setupTarget() {
    await waitForDOMContentLoaded();

    this.targetEl = this.el.querySelector(this.data.target);
    this.target = this.targetEl.object3D;

    this.targetEl.addEventListener("animationcomplete", () => {
      this.targetEl.removeAttribute("animation__show");
    });

    this.target.scale.setScalar(0.01); // To avoid "pop" of gigantic button first time
    this.target.matrixNeedsUpdate = true;
  },

  tick() {
    if (!this.target) return;

    if (!this.el.getObject3D("mesh")) {
      return;
    }

    const isVisible = this.targetEl.object3D.visible;
    const opening = isVisible && !this.wasVisible;
    const scaleChanged =
      this.el.object3D.scale.x !== this.previousScaleX ||
      this.el.object3D.scale.y !== this.previousScaleY ||
      this.el.object3D.scale.z !== this.previousScaleZ;
    const isAnimating = this.targetEl.getAttribute("animation__show");

    // If the target is being shown or the scale changed while the opening animation is being run,
    // we need to start or re-start the animation.
    if (opening || (scaleChanged && isAnimating)) {
      this._updateBox(this.data.animate, true);
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
    const pointOnBoxFaceToCamera = new THREE.Vector3();
    const boxCenter = new THREE.Vector3();
    const tempParentWorldScale = new THREE.Vector3();
    const boxFaceNormal = new THREE.Vector3();
    const min = new THREE.Vector3(0.001, 0.001, 0.001);

    return function(animate, forceNewExtents) {
      if (forceNewExtents || this.mesh !== this.el.getObject3D("mesh")) {
        this.mesh = this.el.getObject3D("mesh");
        if (!this.mesh) return;

        const box = getBox(this.el, this.mesh);
        this.halfExtents = box.min
          .clone()
          .negate()
          .add(box.max)
          .multiplyScalar(0.65);

        this.halfExtents.max(min);
      }

      if (!this.target) return;

      getLastWorldPosition(this.cam, camWorldPos);

      let targetSquareDistance = Infinity;
      let targetDir = this.dirs[0].dir;
      let targetHalfExtentStr = this.dirs[0].halfExtent;
      let targetHalfExtent = this.halfExtents[targetHalfExtentStr];
      let targetRotation = this.dirs[0].rotation;
      let targetCameraDot = -1.1;

      this.el.object3D.updateMatrices();

      for (let i = 0; i < this.dirs.length; i++) {
        const dir = this.dirs[i].dir;
        const halfExtentStr = this.dirs[i].halfExtent;
        const halfExtent = this.halfExtents[halfExtentStr];
        pointOnBoxFace.copy(dir).multiplyScalar(halfExtent);
        boxCenter.copy(zero);

        this.el.object3D.localToWorld(pointOnBoxFace);
        this.el.object3D.localToWorld(boxCenter);

        pointOnBoxFaceToCamera.subVectors(camWorldPos, pointOnBoxFace);
        pointOnBoxFaceToCamera.normalize();

        boxFaceNormal.subVectors(pointOnBoxFace, boxCenter);
        boxFaceNormal.normalize();

        // Compute dot between camera + box normal to ensure menus are going to be
        // somewhat perpendicular to camera frustum
        const cameraAngleDotBoxNormal = boxFaceNormal.dot(pointOnBoxFaceToCamera);

        const squareDistance = pointOnBoxFace.distanceToSquared(camWorldPos);
        if (cameraAngleDotBoxNormal > targetCameraDot) {
          targetSquareDistance = squareDistance;
          targetDir = dir;
          targetHalfExtent = halfExtent;
          targetRotation = this.dirs[i].rotation;
          targetHalfExtentStr = halfExtentStr;
          targetCameraDot = cameraAngleDotBoxNormal;
        }
      }

      this.target.position.copy(targetPosition.copy(targetDir).multiplyScalar(targetHalfExtent));
      this.target.rotation.set(0, targetRotation, 0);

      tempParentWorldScale.setFromMatrixScale(this.target.parent.matrixWorld);

      const distance = Math.sqrt(targetSquareDistance);
      const scale = Math.max(this.halfExtents.x, this.halfExtents.z) * distance;
      const targetScale = Math.min(
        this.el.sceneEl.systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_FIRST_PERSON ? 2.0 : 4.0,
        Math.max(0.5, scale * tempParentWorldScale.x)
      );
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
