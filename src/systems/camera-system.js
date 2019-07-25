import { waitForDOMContentLoaded } from "../utils/async-utils";
import { setMatrixWorld } from "../utils/three-utils";

const positionRigSuchThatCameraIsInFrontOfObject = (function() {
  const r = new THREE.Vector3();
  const rq = new THREE.Quaternion();
  const c = new THREE.Vector3();
  const cq = new THREE.Quaternion();
  const o = new THREE.Vector3();
  const o2 = new THREE.Vector3();
  const oq = new THREE.Quaternion();
  const coq = new THREE.Quaternion();
  const q = new THREE.Quaternion();

  const cp = new THREE.Vector3();
  const op = new THREE.Vector3();
  const v = new THREE.Vector3();
  const p = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);

  const oScale = new THREE.Vector3();
  return function positionRigSuchThatCameraIsInFrontOfObject(rig, camera, object) {
    // assume
    //  - camera is rig's child
    //  - scales are 1
    //  - object is not flat on the floor
    rig.getWorldQuaternion(rq);
    camera.getWorldQuaternion(cq);
    object.getWorldQuaternion(oq);

    r.set(0, 0, 1)
      .applyQuaternion(rq) //     .projectOnPlane(UP) // not needed here since rig is assumed flat
      .normalize();

    c.set(0, 0, -1)
      .applyQuaternion(cq)
      .projectOnPlane(UP)
      .normalize();

    o.set(0, 0, -1).applyQuaternion(oq);
    o2.copy(o)
      .projectOnPlane(UP)
      .normalize();

    coq.setFromUnitVectors(c, o2);
    q.copy(rq).premultiply(coq);

    cp.copy(camera.position);
    object.getWorldPosition(op);

    object.getWorldScale(oScale);
    //const isMobileNonVR = AFRAME.utils.device.isMobile() && !AFRAME.utils.device.isMobileVR();
    // TODO: Position yourself slightly farther away when on mobile. Better yet, make use of
    // the screen size / frustrum info
    v.copy(cp).multiplyScalar(-1);
    p.copy(op)
      .sub(o.multiplyScalar(oScale.length() * 0.4))
      //      .sub(new THREE.Vector3(0, o.y / 2, 0))
      .add(v);

    rig.quaternion.copy(q);
    rig.position.copy(p);
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
        this.el.sceneEl.systems["post-physics"].cameraSystem.inspect(this.inspectable.object3D);
      }
    });
    this.el.object3D.addEventListener("holdable-button-down", () => {
      if (this.el.sceneEl.is("vr-mode")) {
        this.el.sceneEl.systems["post-physics"].cameraSystem.inspect(this.inspectable.object3D);
      }
    });
    this.el.object3D.addEventListener("holdable-button-up", () => {
      if (this.el.sceneEl.is("vr-mode")) {
        this.el.sceneEl.systems["post-physics"].cameraSystem.uninspect();
      }
    });
  }
});
