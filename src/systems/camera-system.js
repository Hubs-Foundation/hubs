import { waitForDOMContentLoaded } from "../utils/async-utils";
import { setMatrixWorld } from "../utils/three-utils";
import { paths } from "./userinput/paths";
import { getBox } from "../utils/auto-box-collider";
import qsTruthy from "../utils/qs_truthy";
const enableThirdPersonMode = qsTruthy("thirdPerson");

function inParentHierarchyOf(o, child) {
  while (child) {
    if (child === o) return true;
    child = child.parent;
  }
  return false;
}

function getBatch(inspected, batchManagerSystem) {
  return (
    batchManagerSystem.batchManager &&
    (batchManagerSystem.batchManager.batchForMesh.get(inspected) ||
      (inspected.el &&
        inspected.el.object3DMap.mesh &&
        batchManagerSystem.batchManager.batchForMesh.get(inspected.el.object3DMap.mesh)))
  );
}

const calculateViewingDistance = (function() {
  return function calculateViewingDistance(camera, object, box, center) {
    const halfYExtents = Math.max(Math.abs(box.max.y - center.y), Math.abs(center.y - box.min.y));
    const halfXExtents = Math.max(Math.abs(box.max.x - center.x), Math.abs(center.x - box.min.x));
    const halfVertFOV = THREE.Math.degToRad(camera.el.sceneEl.camera.fov / 2);
    const halfHorFOV =
      Math.atan(Math.tan(halfVertFOV) * camera.el.sceneEl.camera.aspect) * (object.el.sceneEl.is("vr-mode") ? 0.5 : 1);
    const margin = 1.05;
    const length1 = Math.abs((halfYExtents * margin) / Math.tan(halfVertFOV));
    const length2 = Math.abs((halfXExtents * margin) / Math.tan(halfHorFOV));
    const length3 = Math.abs(box.max.z - center.z) + Math.max(length1, length2);
    const length = object.el.sceneEl.is("vr-mode") ? Math.max(0.25, length3) : length3;
    return length || 1.25;
  };
})();

const decompose = (function() {
  const scale = new THREE.Vector3();
  return function decompose(m, p, q) {
    m.decompose(p, q, scale); //ignore scale, like we're dealing with a motor
  };
})();

export const childMatch = (function() {
  const cp = new THREE.Vector3();
  const cq = new THREE.Quaternion();
  const cqI = new THREE.Quaternion();
  const twp = new THREE.Vector3();
  const twq = new THREE.Quaternion();
  // transform the parent such that its child matches the target
  return function childMatch(parent, child, target) {
    target.updateMatrices();
    decompose(target.matrixWorld, twp, twq);
    cp.copy(child.position);
    cq.copy(child.quaternion);
    cqI.copy(cq).inverse();
    parent.quaternion.copy(twq).multiply(cqI);
    parent.position.subVectors(twp, cp.applyQuaternion(parent.quaternion));
    parent.matrixNeedsUpdate = true;
  };
})();

const IDENTITY = new THREE.Matrix4().identity();

const orbit = (function() {
  const owq = new THREE.Quaternion();
  const owp = new THREE.Vector3();
  const cwq = new THREE.Quaternion();
  const cwp = new THREE.Vector3();
  const rwq = new THREE.Quaternion();
  const UP = new THREE.Vector3();
  const RIGHT = new THREE.Vector3();
  const target = new THREE.Object3D();
  const dhQ = new THREE.Quaternion();
  const dvQ = new THREE.Quaternion();
  return function orbit(object, rig, camera, dh, dv, dz, dt) {
    if (!target.parent) {
      // add dummy object to the scene, if this is the first time we call this function
      AFRAME.scenes[0].object3D.add(target);
      target.applyMatrix(IDENTITY); // make sure target gets updated at least once for our matrix optimizations
    }
    object.updateMatrices();
    decompose(object.matrixWorld, owp, owq);
    decompose(camera.matrixWorld, cwp, cwq);
    rig.getWorldQuaternion(rwq);

    dhQ.setFromAxisAngle(UP.set(0, 1, 0).applyQuaternion(owq), 0.1 * dh * dt);
    target.quaternion.copy(cwq).premultiply(dhQ);
    const dPos = new THREE.Vector3().subVectors(cwp, owp);
    const zoom = 1 - dz * dt;
    const newLength = dPos.length() * zoom;
    // TODO: These limits should be calculated based on the calculated view distance.
    if (newLength > 0.1 && newLength < 100) {
      dPos.multiplyScalar(zoom);
    }

    dvQ.setFromAxisAngle(RIGHT.set(1, 0, 0).applyQuaternion(target.quaternion), 0.1 * dv * dt);
    target.quaternion.premultiply(dvQ);
    target.position.addVectors(owp, dPos.applyQuaternion(dhQ).applyQuaternion(dvQ));
    target.matrixNeedsUpdate = true;
    childMatch(rig, camera, target);
  };
})();

const moveRigSoCameraLooksAtObject = (function() {
  const owq = new THREE.Quaternion();
  const owp = new THREE.Vector3();
  const cwq = new THREE.Quaternion();
  const cwp = new THREE.Vector3();
  const oForw = new THREE.Vector3();
  const center = new THREE.Vector3();
  const target = new THREE.Object3D();
  return function moveRigSoCameraLooksAtObject(rig, camera, object, distanceMod) {
    if (!target.parent) {
      // add dummy object to the scene, if this is the first time we call this function
      AFRAME.scenes[0].object3D.add(target);
      target.applyMatrix(IDENTITY); // make sure target gets updated at least once for our matrix optimizations
    }

    object.updateMatrices();
    decompose(object.matrixWorld, owp, owq);
    decompose(camera.matrixWorld, cwp, cwq);
    rig.getWorldQuaternion(cwq);

    const box = getBox(object.el, object.el.getObject3D("mesh") || object, true);
    box.getCenter(center);
    const dist = calculateViewingDistance(camera, object, box, center) * distanceMod;
    target.position.addVectors(
      owp,
      oForw
        .set(0, 0, 1)
        .multiplyScalar(dist)
        .applyQuaternion(owq)
    );
    target.quaternion.copy(owq);
    target.matrixNeedsUpdate = true;
    childMatch(rig, camera, target);
  };
})();

export const CAMERA_MODE_FIRST_PERSON = 0;
export const CAMERA_MODE_THIRD_PERSON_NEAR = 1;
export const CAMERA_MODE_THIRD_PERSON_FAR = 2;
export const CAMERA_MODE_INSPECT = 3;
export const CAMERA_MODE_SCENE_PREVIEW = 4;

const NEXT_MODES = {
  [CAMERA_MODE_FIRST_PERSON]: CAMERA_MODE_THIRD_PERSON_NEAR,
  [CAMERA_MODE_THIRD_PERSON_NEAR]: CAMERA_MODE_THIRD_PERSON_FAR,
  [CAMERA_MODE_THIRD_PERSON_FAR]: CAMERA_MODE_FIRST_PERSON
};

const CAMERA_LAYER_INSPECT = 4;
const enableInspectLayer = function(o) {
  o.layers.enable(CAMERA_LAYER_INSPECT);
};
const disableInspectLayer = function(o) {
  o.layers.disable(CAMERA_LAYER_INSPECT);
};

function setupSphere(sphere) {
  sphere.object3D.traverse(o => o.layers.set(CAMERA_LAYER_INSPECT));
  sphere.object3DMap.mesh.material.side = 2;
  sphere.object3DMap.mesh.material.color.setHex(0x020202);
  sphere.object3D.scale.multiplyScalar(100);
  sphere.object3D.matrixNeedsUpdate = true;
}

function getAudio(o) {
  let audio;
  o.traverse(c => {
    if (!audio && c.type === "Audio") {
      audio = c;
    }
  });
  return audio;
}

const FALLOFF = 0.9;
export class CameraSystem {
  constructor(batchManagerSystem) {
    this.enableLights = false;
    this.verticalDelta = 0;
    this.horizontalDelta = 0;
    this.inspectZoom = 0;
    this.inspectedMeshesFromBatch = [];
    this.batchManagerSystem = batchManagerSystem;
    this.mode = CAMERA_MODE_SCENE_PREVIEW;
    this.snapshot = { audioTransform: new THREE.Matrix4(), matrixWorld: new THREE.Matrix4() };
    this.audioListenerTargetTransform = new THREE.Matrix4();
    waitForDOMContentLoaded().then(() => {
      this.avatarPOV = document.getElementById("avatar-pov-node");
      this.avatarRig = document.getElementById("avatar-rig");
      this.viewingCamera = document.getElementById("viewing-camera");
      this.viewingRig = document.getElementById("viewing-rig");

      const sphere = document.getElementById("inspect-sphere");
      // TODO: Make this synchronous, don't use a-sphere
      const i = setInterval(() => {
        if (sphere.object3DMap && sphere.object3DMap.mesh) {
          clearInterval(i);
          setupSphere(sphere);
        }
      }, 2000);
    });
  }

  nextMode() {
    if (this.mode === CAMERA_MODE_INSPECT) {
      this.uninspect();
      return;
    }

    if (!enableThirdPersonMode) return;
    if (this.mode === CAMERA_MODE_SCENE_PREVIEW) return;

    this.mode = NEXT_MODES[this.mode] || 0;
    if (this.mode === CAMERA_MODE_FIRST_PERSON) {
      AFRAME.scenes[0].renderer.vr.setPoseTarget(this.avatarPOV.object3D);
    } else if (this.mode === CAMERA_MODE_THIRD_PERSON_NEAR || this.mode === CAMERA_MODE_THIRD_PERSON_FAR) {
      AFRAME.scenes[0].renderer.vr.setPoseTarget(this.viewingCamera.object3D);
    }
  }

  inspect(o, distanceMod, temporarilyDisableRegularExit) {
    this.verticalDelta = 0;
    this.horizontalDelta = 0;
    this.inspectZoom = 0;
    this.temporarilyDisableRegularExit = temporarilyDisableRegularExit; // TODO: Do this at the action set layer
    if (this.mode === CAMERA_MODE_INSPECT) {
      return;
    }
    const scene = AFRAME.scenes[0];
    scene.classList.add("hand-cursor");
    scene.classList.remove("no-cursor");
    this.snapshot.mode = this.mode;
    this.mode = CAMERA_MODE_INSPECT;
    this.inspected = o;

    if (!this.enableLights) {
      this.hideEverythingButThisObject(o);
    }

    this.viewingCamera.object3D.updateMatrices();
    this.snapshot.matrixWorld.copy(this.viewingRig.object3D.matrixWorld);

    moveRigSoCameraLooksAtObject(
      this.viewingRig.object3D,
      this.viewingCamera.object3D,
      this.inspected,
      distanceMod || 1
    );

    this.snapshot.audio = getAudio(o);
    if (this.snapshot.audio) {
      this.snapshot.audio.updateMatrices();
      this.snapshot.audioTransform.copy(this.snapshot.audio.matrixWorld);
      scene.audioListener.updateMatrices();
      this.audioListenerTargetTransform.makeTranslation(0, 0, 1).premultiply(scene.audioListener.matrixWorld);
      setMatrixWorld(this.snapshot.audio, this.audioListenerTargetTransform);
    }
  }

  uninspect() {
    this.temporarilyDisableRegularExit = false;
    if (this.mode !== CAMERA_MODE_INSPECT) return;
    const scene = AFRAME.scenes[0];
    if (scene.is("entered")) {
      scene.classList.remove("hand-cursor");
      scene.classList.add("no-cursor");
    }
    this.showEverythingAsNormal();
    this.inspected = null;
    if (this.snapshot.audio) {
      setMatrixWorld(this.snapshot.audio, this.snapshot.audioTransform);
      this.snapshot.audio = null;
    }

    this.mode = this.snapshot.mode;
    if (this.snapshot.mode === CAMERA_MODE_SCENE_PREVIEW) {
      setMatrixWorld(this.viewingRig.object3D, this.snapshot.matrixWorld);
    }
    this.snapshot.mode = null;
    this.tick(AFRAME.scenes[0]);
  }

  hideEverythingButThisObject(o) {
    this.inspectedMeshesFromBatch.length = 0;
    const batch = getBatch(o, this.batchManagerSystem);
    (batch || o).traverse(enableInspectLayer);
    if (batch) {
      for (let instanceId = 0; instanceId < batch.ubo.meshes.length; instanceId++) {
        const mesh = batch.ubo.meshes[instanceId];
        if (!mesh) continue;
        if (inParentHierarchyOf(this.inspected, mesh)) {
          this.inspectedMeshesFromBatch.push(mesh);
        }
      }
    }

    const scene = AFRAME.scenes[0];
    const vrMode = scene.is("vr-mode");
    const camera = vrMode ? scene.renderer.vr.getCamera(scene.camera) : scene.camera;
    this.snapshot.mask = camera.layers.mask;
    camera.layers.set(CAMERA_LAYER_INSPECT);
    if (vrMode) {
      this.snapshot.mask0 = camera.cameras[0].layers.mask;
      this.snapshot.mask1 = camera.cameras[1].layers.mask;
      camera.cameras[0].layers.set(CAMERA_LAYER_INSPECT);
      camera.cameras[1].layers.set(CAMERA_LAYER_INSPECT);
    }
  }

  showEverythingAsNormal() {
    this.inspectedMeshesFromBatch.length = 0;
    this.inspectedMeshesFromBatch = [];
    if (this.inspected) {
      (getBatch(this.inspected, this.batchManagerSystem) || this.inspected).traverse(disableInspectLayer);
    }
    const scene = AFRAME.scenes[0];
    const vrMode = scene.is("vr-mode");
    const camera = vrMode ? scene.renderer.vr.getCamera(scene.camera) : scene.camera;
    camera.layers.mask = this.snapshot.mask;
    if (vrMode) {
      camera.cameras[0].layers.mask = this.snapshot.mask0;
      camera.cameras[1].layers.mask = this.snapshot.mask1;
    }
  }

  tick = (function() {
    const translation = new THREE.Matrix4();
    return function tick(scene, dt) {
      if (!this.enteredScene && scene.is("entered")) {
        this.enteredScene = true;
        this.mode = CAMERA_MODE_FIRST_PERSON;
      }
      this.avatarPOVRotator = this.avatarPOVRotator || this.avatarPOV.components["pitch-yaw-rotator"];
      this.viewingCameraRotator = this.viewingCameraRotator || this.viewingCamera.components["pitch-yaw-rotator"];
      this.avatarPOVRotator.on = true;
      this.viewingCameraRotator.on = true;

      this.userinput = this.userinput || scene.systems.userinput;
      if (
        !this.temporarilyDisableRegularExit &&
        this.mode === CAMERA_MODE_INSPECT &&
        this.userinput.get(paths.actions.stopInspecting)
      ) {
        scene.emit("uninspect");
        this.uninspect();
      }
      if (this.userinput.get(paths.actions.nextCameraMode)) {
        this.nextMode();
      }

      const headShouldBeVisible = this.mode !== CAMERA_MODE_FIRST_PERSON;
      this.playerHead = this.playerHead || document.getElementById("avatar-head");
      if (this.playerHead && headShouldBeVisible !== this.playerHead.object3D.visible) {
        this.playerHead.object3D.visible = headShouldBeVisible;

        // Skip a frame so we don't see our own avatar, etc.
        return;
      }

      if (this.mode === CAMERA_MODE_FIRST_PERSON) {
        this.viewingCameraRotator.on = false;
        this.avatarRig.object3D.updateMatrices();
        setMatrixWorld(this.viewingRig.object3D, this.avatarRig.object3D.matrixWorld);
        if (scene.is("vr-mode")) {
          this.viewingCamera.object3D.updateMatrices();
          setMatrixWorld(this.avatarPOV.object3D, this.viewingCamera.object3D.matrixWorld);
        } else {
          this.avatarPOV.object3D.updateMatrices();
          setMatrixWorld(this.viewingCamera.object3D, this.avatarPOV.object3D.matrixWorld);
        }
      } else if (this.mode === CAMERA_MODE_THIRD_PERSON_NEAR || this.mode === CAMERA_MODE_THIRD_PERSON_FAR) {
        if (this.mode === CAMERA_MODE_THIRD_PERSON_NEAR) {
          translation.makeTranslation(0, 1, 3);
        } else {
          translation.makeTranslation(0, 2, 8);
        }
        this.avatarRig.object3D.updateMatrices();
        this.viewingRig.object3D.matrixWorld.copy(this.avatarRig.object3D.matrixWorld).multiply(translation);
        setMatrixWorld(this.viewingRig.object3D, this.viewingRig.object3D.matrixWorld);
        this.avatarPOV.object3D.quaternion.copy(this.viewingCamera.object3D.quaternion);
        this.avatarPOV.object3D.matrixNeedsUpdate = true;
      } else if (this.mode === CAMERA_MODE_INSPECT) {
        this.avatarPOVRotator.on = false;
        this.viewingCameraRotator.on = false;
        const cameraDelta = this.userinput.get(
          scene.is("entered") ? paths.actions.cameraDelta : paths.actions.lobbyCameraDelta
        );

        if (cameraDelta) {
          // TODO: Move device specific tinkering to action sets
          const horizontalDelta = (AFRAME.utils.device.isMobile() ? -0.6 : 1) * cameraDelta[0] || 0;
          const verticalDelta = (AFRAME.utils.device.isMobile() ? -1.2 : 1) * cameraDelta[1] || 0;
          this.horizontalDelta = (this.horizontalDelta + horizontalDelta) / 2;
          this.verticalDelta = (this.verticalDelta + verticalDelta) / 2;
        } else if (Math.abs(this.verticalDelta) > 0.0001 || Math.abs(this.horizontalDelta) > 0.0001) {
          this.verticalDelta = FALLOFF * this.verticalDelta;
          this.horizontalDelta = FALLOFF * this.horizontalDelta;
        }

        const inspectZoom = this.userinput.get(paths.actions.inspectZoom) * 0.001;
        if (inspectZoom) {
          this.inspectZoom = (inspectZoom + this.inspectZoom) / 2;
        } else if (Math.abs(this.inspectZoom) > 0.0001) {
          this.inspectZoom = FALLOFF * this.inspectZoom;
        }

        if (
          Math.abs(this.verticalDelta) > 0.001 ||
          Math.abs(this.horizontalDelta) > 0.001 ||
          Math.abs(this.inspectZoom) > 0.001
        ) {
          orbit(
            this.inspected,
            this.viewingRig.object3D,
            this.viewingCamera.object3D,
            this.horizontalDelta,
            this.verticalDelta,
            this.inspectZoom,
            dt
          );
        }
      }

      if (scene.audioListener && this.avatarPOV) {
        if (
          (this.mode === CAMERA_MODE_FIRST_PERSON || this.mode === CAMERA_MODE_INSPECT) &&
          scene.audioListener.parent !== this.avatarPOV.object3D
        ) {
          this.avatarPOV.object3D.add(scene.audioListener);
        } else if (
          (this.mode === CAMERA_MODE_THIRD_PERSON_NEAR || this.mode === CAMERA_MODE_THIRD_PERSON_FAR) &&
          scene.audioListener.parent !== this.viewingCamera.object3D
        ) {
          this.viewingCamera.object3D.add(scene.audioListener);
        }
      }
    };
  })();
}
