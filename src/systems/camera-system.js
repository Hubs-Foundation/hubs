import { waitForDOMContentLoaded } from "../utils/async-utils";
import { setMatrixWorld } from "../utils/three-utils";

let numCameraModes = 0;
const CAMERA_MODE_FIRST_PERSON = numCameraModes++;
const CAMERA_MODE_THIRD_PERSON_NEAR = numCameraModes++;
const CAMERA_MODE_THIRD_PERSON_FAR = numCameraModes++;

export class CameraSystem {
  constructor() {
    this.mode = CAMERA_MODE_FIRST_PERSON;
    waitForDOMContentLoaded().then(() => {
      this.playerCamera = document.getElementById("player-camera");
      this.playerRig = document.getElementById("player-rig");
      this.cameraEl = document.getElementById("experimental-camera");
      this.rigEl = document.getElementById("experimental-rig");
      this.rigEl.object3D.matrixWorldNeedsUpdate = true;
      this.rigEl.object3D.matrixIsModified = true;

      document.addEventListener("keydown", e => {
        if (e.key === "o") {
          this.nextMode();
        }
      });
    });
  }
  nextMode() {
    this.mode = (this.mode + 1) % numCameraModes;
    if (this.mode === CAMERA_MODE_FIRST_PERSON) {
      AFRAME.scenes[0].renderer.vr.setPoseTarget(this.playerCamera.object3D);
    } else if (this.mode === CAMERA_MODE_THIRD_PERSON_NEAR || this.mode === CAMERA_MODE_THIRD_PERSON_FAR) {
      AFRAME.scenes[0].renderer.vr.setPoseTarget(this.cameraEl.object3D);
    }
  }
  tick() {
    this.playerHead = this.playerHead || document.getElementById("player-head");
    if (!this.playerHead) return;
    if (!this.playerCamera) return;

    const visible = this.mode !== CAMERA_MODE_FIRST_PERSON;
    if (visible !== this.playerHead.object3D.visible) {
      this.playerHead.object3D.visible = visible;
    }

    if (this.mode === CAMERA_MODE_FIRST_PERSON) {
      setMatrixWorld(this.cameraEl.object3D, this.playerCamera.object3D.matrixWorld);
    }

    const m2 = new THREE.Matrix4().copy(this.playerRig.object3D.matrixWorld);
    if (this.mode === CAMERA_MODE_FIRST_PERSON) {
      setMatrixWorld(this.rigEl.object3D, m2);
    }
    if (this.mode === CAMERA_MODE_THIRD_PERSON_NEAR || this.mode === CAMERA_MODE_THIRD_PERSON_FAR) {
      var offset = new THREE.Vector3(0, 1, 3);
      if (this.mode === CAMERA_MODE_THIRD_PERSON_FAR) {
        offset.multiplyScalar(3);
      }
      const m3 = new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z);
      m2.multiply(m3);
      setMatrixWorld(this.rigEl.object3D, m2);
      this.playerCamera.object3D.quaternion.copy(this.cameraEl.object3D.quaternion);
    }
  }
}
