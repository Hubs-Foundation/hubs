import { waitForDOMContentLoaded } from "../utils/async-utils";
import { setMatrixWorld, positionRigSuchThatCameraIsInFrontOfObject } from "../utils/three-utils";

let numCameraModes = 0;
const CAMERA_MODE_FIRST_PERSON = numCameraModes++;
const CAMERA_MODE_THIRD_PERSON_NEAR = numCameraModes++;
const CAMERA_MODE_THIRD_PERSON_FAR = numCameraModes++;
const CAMERA_MODE_INSPECT = numCameraModes++;

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
        if (e.key === "O") {
          this.uninspect();
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
    } else if (this.mode === CAMERA_MODE_INSPECT) {
      this.mode = CAMERA_MODE_FIRST_PERSON; // skip inspect for now
    }
  }
  inspect(o) {
    if (this.mode !== CAMERA_MODE_INSPECT) {
      this.preInspectMode = this.mode;
    }
    this.mode = CAMERA_MODE_INSPECT;
    this.inspected = o;
    positionRigSuchThatCameraIsInFrontOfObject(this.rigEl.object3D, this.cameraEl.object3D, this.inspected);
  }
  uninspect() {
    if (this.mode !== CAMERA_MODE_INSPECT) {
      return;
    }
    this.mode = this.preInspectMode || CAMERA_MODE_FIRST_PERSON;
    this.inspected = null;
  }
  tick() {
    this.playerHead = this.playerHead || document.getElementById("player-head");
    if (!this.playerHead) return;
    if (!this.playerCamera) return;
    this.playerCamera.components["pitch-yaw-rotator"].on = true;
    this.cameraEl.components["pitch-yaw-rotator"].on = true;

    const visible = this.mode !== CAMERA_MODE_FIRST_PERSON;
    if (visible !== this.playerHead.object3D.visible) {
      this.playerHead.object3D.visible = visible;
    }

    if (this.mode === CAMERA_MODE_FIRST_PERSON) {
      setMatrixWorld(this.cameraEl.object3D, this.playerCamera.object3D.matrixWorld);
    }

    if (this.mode === CAMERA_MODE_FIRST_PERSON) {
      this.cameraEl.components["pitch-yaw-rotator"].on = false;
      const m2 = new THREE.Matrix4().copy(this.playerRig.object3D.matrixWorld);
      setMatrixWorld(this.rigEl.object3D, m2);
    }
    if (this.mode === CAMERA_MODE_THIRD_PERSON_NEAR || this.mode === CAMERA_MODE_THIRD_PERSON_FAR) {
      var offset = new THREE.Vector3(0, 1, 3);
      if (this.mode === CAMERA_MODE_THIRD_PERSON_FAR) {
        offset.multiplyScalar(3);
      }
      const m3 = new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z);
      const m2 = new THREE.Matrix4().copy(this.playerRig.object3D.matrixWorld);
      m2.multiply(m3);
      setMatrixWorld(this.rigEl.object3D, m2);
      this.playerCamera.object3D.quaternion.copy(this.cameraEl.object3D.quaternion);
    }
    if (this.mode === CAMERA_MODE_INSPECT) {
    }
  }
}

function getInspectable(child) {
  let el = child;
  while (el) {
    if (el.components && el.components.tags && el.components.tags.data.inspectable) return el;
    el = el.parentNode;
  }
  return null;
}

AFRAME.registerComponent("inspect-button", {
  init() {
    this.inspectable = getInspectable(this.el);
    if (!this.inspectable) {
      console.error("You put an inspect button but I could not find what you want to inspect");
    }
    this.el.object3D.addEventListener("holdable-button-down", () => {
      this.el.sceneEl.systems["hubs-systems"].cameraSystem.inspect(this.inspectable.object3D);
    });
    this.el.object3D.addEventListener("holdable-button-up", () => {
//      this.el.sceneEl.systems["hubs-systems"].cameraSystem.uninspect();
    });
  }
});
