import { waitForDOMContentLoaded } from "../utils/async-utils";
import { setMatrixWorld } from "../utils/three-utils";
import { paths } from "./userinput/paths";

const moveRigSoCameraLooksAtObject = (function() {
  const cqInv = new THREE.Quaternion();
  const owq = new THREE.Quaternion();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const owp = new THREE.Vector3();

  return function moveRigSoCameraLooksAtObject(rig, camera, object) {
    object.getWorldQuaternion(owq);
    object.getWorldPosition(owp);
    cqInv.copy(camera.quaternion).inverse();
    rig.quaternion.copy(owq).multiply(cqInv);

    v1.set(0, 0, 1).applyQuaternion(owq);
    v2.copy(camera.position).applyQuaternion(rig.quaternion);
    rig.position.subVectors(v1, v2).add(owp);

    rig.matrixNeedsUpdate = true;
  };
})();

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
    this.inspected = null;
  }
  inspect(o) {
    if (this.mode !== CAMERA_MODE_INSPECT) {
      this.preInspectMode = this.mode;
    }
    this.mode = CAMERA_MODE_INSPECT;
    this.inspected = o;
    moveRigSoCameraLooksAtObject(this.rigEl.object3D, this.cameraEl.object3D, this.inspected);
  }
  uninspect() {
    this.inspected = null;
    if (this.mode !== CAMERA_MODE_INSPECT) {
      return;
    }
    this.mode = this.preInspectMode || CAMERA_MODE_FIRST_PERSON;
  }
  tick() {
    this.playerHead = this.playerHead || document.getElementById("player-head");
    if (!this.playerHead) return;
    if (!this.playerCamera) return;
    this.playerCamera.components["pitch-yaw-rotator"].on = true;
    this.cameraEl.components["pitch-yaw-rotator"].on = true;

    const userinput = AFRAME.scenes[0].systems.userinput;
    if (userinput.get(paths.actions.nextCameraMode)) {
      this.nextMode();
    }

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

    if (!!this.inspected) {
      const stopInspecting = userinput.get(paths.actions.stopInspecting);
      if (stopInspecting) {
        this.uninspect();
      }
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
    this.el.object3D.addEventListener("interact", () => {
      if (!this.el.sceneEl.is("vr-mode")) {
        this.el.sceneEl.systems["hubs-systems"].cameraSystem.inspect(this.inspectable.object3D);
      }
    });

    this.el.object3D.addEventListener("holdable-button-down", () => {
      if (this.el.sceneEl.is("vr-mode")) {
        this.el.sceneEl.systems["hubs-systems"].cameraSystem.inspect(this.inspectable.object3D);
      }
    });
    this.el.object3D.addEventListener("holdable-button-up", () => {
      if (this.el.sceneEl.is("vr-mode")) {
        this.el.sceneEl.systems["hubs-systems"].cameraSystem.uninspect();
      }
    });
  }
});
