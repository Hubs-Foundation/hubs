import { computeObjectAABB } from "../utils/auto-box-collider";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { setMatrixWorld } from "../utils/three-utils";

const calculateRotation = (function() {
  const objectPos = new THREE.Vector3();
  const cameraPos = new THREE.Vector3();
  const up = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const rotationMatrix = new THREE.Matrix4();
  return function calculateRotation(object, camera) {
    object.updateMatrices();
    camera.updateMatrices();
    objectPos.setFromMatrixPosition(object.matrixWorld);
    cameraPos.setFromMatrixPosition(camera.matrixWorld);
    forward.subVectors(objectPos, cameraPos);
    forward.y = 0;
    forward.normalize();
    up.set(0, 1, 0);
    right.crossVectors(forward, up);
    rotationMatrix.makeBasis(right, up, forward.multiplyScalar(-1));
    return rotationMatrix;
  };
})();

AFRAME.registerComponent("position-around-cylinder", {
  schema: {
    target: { type: "string" }
  },

  init() {
    waitForDOMContentLoaded().then(() => {
      this.viewingCam = document.getElementById("viewing-camera").object3D;
      this.targetEl = this.el.querySelector(this.data.target);
      this.targetEl.addEventListener("animationcomplete", () => {
        this.targetEl.removeAttribute("animation__show");
      });
      this.target = this.targetEl.object3D;
      this.target.scale.setScalar(0.01); // To avoid "pop" of gigantic button first time
      this.target.matrixNeedsUpdate = true;
    });
    this.center = new THREE.Vector3();
    this.targetMatrix = new THREE.Matrix4();
    this.AABB = new THREE.Box3();
    this.towardCamera = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();
  },
  tick() {
    //TODO: fix the names. "target" is the menu sometimes and the object other times
    if (!this.target || !this.el.getObject3D("mesh")) {
      return;
    }
    this.el.object3D.updateMatrices();
    this.el.getObject3D("mesh").updateMatrices();
    computeObjectAABB(this.el.getObject3D("mesh"), this.AABB);
    const radius =
      Math.max(Math.abs(this.AABB.max.x - this.AABB.min.x), Math.abs(this.AABB.max.z - this.AABB.min.z), 0.025) / 2;
    this.center.addVectors(this.AABB.min, this.AABB.max).multiplyScalar(0.5);
    this.targetMatrix.copy(calculateRotation(this.el.object3D, this.viewingCam));
    this.towardCamera.setFromMatrixColumn(this.targetMatrix, 2);
    this.towardCamera.multiplyScalar(radius);

    this.targetPosition.addVectors(this.center, this.towardCamera);
    this.targetMatrix.elements[12] = this.targetPosition.x;
    this.targetMatrix.elements[13] = this.targetPosition.y;
    this.targetMatrix.elements[14] = this.targetPosition.z;
    setMatrixWorld(this.target, this.targetMatrix);
  }
});
