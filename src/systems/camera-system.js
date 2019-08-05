import { waitForDOMContentLoaded } from "../utils/async-utils";
import { setMatrixWorld } from "../utils/three-utils";
import { paths } from "./userinput/paths";
import { getBox } from "../utils/auto-box-collider";
import qsTruthy from "../utils/qs_truthy";
const enableThirdPersonMode = qsTruthy("thirdPerson");

const calculateViewingDistance = (function() {
  const center = new THREE.Vector3();
  return function calculateViewingDistance(camera, object) {
    const box = getBox(object.el, object.el.getObject3D("mesh"), true);
    box.getCenter(center);
    const halfYExtents = Math.max(Math.abs(box.max.y - center.y), Math.abs(center.y - box.min.y));
    const halfXExtents = Math.max(Math.abs(box.max.x - center.x), Math.abs(center.x - box.min.x));
    const halfVertFOV = THREE.Math.degToRad(camera.el.sceneEl.camera.fov / 2);
    const halfHorFOV =
      Math.atan(Math.tan(halfVertFOV) * camera.el.sceneEl.camera.aspect) * (object.el.sceneEl.is("vr-mode") ? 0.5 : 1);
    const margin = 1.05;
    const l1 = Math.abs((halfYExtents * margin) / Math.tan(halfVertFOV));
    const l2 = Math.abs((halfXExtents * margin) / Math.tan(halfHorFOV));
    const l3 = Math.abs(box.max.z - center.z) + Math.max(l1, l2);
    const l = object.el.sceneEl.is("vr-mode") ? Math.max(0.25, l3) : l3;
    return l;
  };
})();

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

    v1.set(0, 0, 1)
      .multiplyScalar(calculateViewingDistance(camera, object))
      .applyQuaternion(owq);
    v2.copy(camera.position).applyQuaternion(rig.quaternion);
    rig.position.subVectors(v1, v2).add(owp);

    rig.matrixNeedsUpdate = true;
  };
})();

export const CAMERA_MODE_FIRST_PERSON = 0;
export const CAMERA_MODE_THIRD_PERSON_NEAR = 1;
export const CAMERA_MODE_THIRD_PERSON_FAR = 2;
export const CAMERA_MODE_INSPECT = 3;

const NEXT_MODES = {
  [CAMERA_MODE_FIRST_PERSON]: CAMERA_MODE_THIRD_PERSON_NEAR,
  [CAMERA_MODE_THIRD_PERSON_NEAR]: CAMERA_MODE_THIRD_PERSON_FAR,
  [CAMERA_MODE_THIRD_PERSON_FAR]: CAMERA_MODE_FIRST_PERSON
};

export class CameraSystem {
  constructor() {
    this.mode = CAMERA_MODE_FIRST_PERSON;
    waitForDOMContentLoaded().then(() => {
      this.avatarPOV = document.getElementById("avatar-pov-node");
      this.avatarRig = document.getElementById("avatar-rig");
      this.cameraEl = document.getElementById("viewing-camera");
      this.rigEl = document.getElementById("viewing-rig");
    });
  }
  nextMode() {
    if (this.mode === CAMERA_MODE_INSPECT) {
      this.uninspect();
      return;
    }

    if (!enableThirdPersonMode) return;

    this.mode = NEXT_MODES[this.mode];
    if (this.mode === CAMERA_MODE_FIRST_PERSON) {
      AFRAME.scenes[0].renderer.vr.setPoseTarget(this.avatarPOV.object3D);
    } else if (this.mode === CAMERA_MODE_THIRD_PERSON_NEAR || this.mode === CAMERA_MODE_THIRD_PERSON_FAR) {
      AFRAME.scenes[0].renderer.vr.setPoseTarget(this.cameraEl.object3D);
    }
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
    if (this.mode !== CAMERA_MODE_INSPECT) return;
    this.mode = this.preInspectMode || CAMERA_MODE_FIRST_PERSON;
    this.preInspectMode = null;
  }
  tick = (function() {
    const m2 = new THREE.Matrix4();
    const m3 = new THREE.Matrix4();
    const offset = new THREE.Vector3();
    return function tick() {
      this.playerHead = this.playerHead || document.getElementById("avatar-head");
      if (!this.playerHead) return;

      this.avatarPOV.components["pitch-yaw-rotator"].on = true;
      this.cameraEl.components["pitch-yaw-rotator"].on = true;

      this.userinput = this.userinput || AFRAME.scenes[0].systems.userinput;
      if (this.inspected) {
        const stopInspecting = this.userinput.get(paths.actions.stopInspecting);
        if (stopInspecting) {
          this.uninspect();
        }
      }

      if (this.userinput.get(paths.actions.nextCameraMode)) {
        this.nextMode();
      }

      const headShouldBeVisible = this.mode !== CAMERA_MODE_FIRST_PERSON;
      if (headShouldBeVisible !== this.playerHead.object3D.visible) {
        this.playerHead.object3D.visible = headShouldBeVisible;
      }

      this.avatarRig.object3D.updateMatrices();
      if (this.mode === CAMERA_MODE_FIRST_PERSON) {
        this.cameraEl.components["pitch-yaw-rotator"].on = false;
        setMatrixWorld(this.rigEl.object3D, this.avatarRig.object3D.matrixWorld);
        if (AFRAME.scenes[0].is("vr-mode")) {
          this.cameraEl.object3D.updateMatrices();
          setMatrixWorld(this.avatarPOV.object3D, this.cameraEl.object3D.matrixWorld);
        } else {
          this.avatarPOV.object3D.updateMatrices();
          setMatrixWorld(this.cameraEl.object3D, this.avatarPOV.object3D.matrixWorld);
        }
      }
      if (this.mode === CAMERA_MODE_THIRD_PERSON_NEAR || this.mode === CAMERA_MODE_THIRD_PERSON_FAR) {
        offset.set(0, 1, 3);
        if (this.mode === CAMERA_MODE_THIRD_PERSON_FAR) {
          offset.multiplyScalar(3);
        }
        m3.makeTranslation(offset.x, offset.y, offset.z);
        m2.copy(this.avatarRig.object3D.matrixWorld);
        m2.multiply(m3);
        setMatrixWorld(this.rigEl.object3D, m2);
        this.avatarPOV.object3D.quaternion.copy(this.cameraEl.object3D.quaternion);
        this.avatarPOV.object3D.matrixNeedsUpdate = true;
      }
    };
  })();
}
