import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { HubsWorld } from "../app";
import { Object3DTag, ScenePreviewCamera } from "../bit-components";
import { Quaternion, Vector3, Euler, Camera } from "three";
import { CAMERA_MODE_INSPECT, CAMERA_MODE_SCENE_PREVIEW, CameraSystem } from "../systems/camera-system";
import { setMatrixWorld } from "../utils/three-utils";
import { getStreamerCamera } from "../components/scene-preview-camera";
import { lerp } from "three/src/math/MathUtils";

const startPositions = new Map<number, Vector3>();
const startRotations = new Map<number, Quaternion>();
const targetPositions = new Map<number, Vector3>();
const targetRotations = new Map<number, Quaternion>();
const startTimes = new Map<number, number>();
const backwards = new Map<number, boolean>();
const ranOnePass = new Map<number, boolean>();
const newRot = new Quaternion();

const updatePreviewCamera = (world: HubsWorld, eid: number, previewCamera: Camera, cameraSystem: CameraSystem) => {
  cameraSystem.mode = CAMERA_MODE_SCENE_PREVIEW;
  const streamerCamera = getStreamerCamera();
  if (streamerCamera) {
    setMatrixWorld(previewCamera, streamerCamera.matrixWorld);
    // Move camera forward just a bit so that we don't see the avatar's eye cylinders.
    previewCamera.translateZ(-0.1);
    previewCamera.matrixNeedsUpdate = true;
  } else {
    const startTime = startTimes.get(eid)!;
    const duration = ScenePreviewCamera.duration[eid];
    let t = (world.time.elapsed - startTime) / (1000.0 * duration);
    t = Math.min(1.0, Math.max(0.0, t));

    if (!ranOnePass.get(eid)) {
      t = t * (2 - t);
    } else {
      t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    const startPosition = startPositions.get(eid)!;
    const targetPosition = targetPositions.get(eid)!;
    const startRotation = startRotations.get(eid)!;
    const targetRotation = targetRotations.get(eid)!;

    const back = backwards.get(eid);
    const from = back ? targetPosition : startPosition;
    const to = back ? startPosition : targetPosition;
    const fromRot = back ? targetRotation : startRotation;
    const toRot = back ? startRotation : targetRotation;

    newRot.slerpQuaternions(fromRot, toRot, t);

    previewCamera.position.set(lerp(from.x, to.x, t), lerp(from.y, to.y, t), lerp(from.z, to.z, t));

    if (!ScenePreviewCamera.positionOnly[eid]) {
      previewCamera.rotation.setFromQuaternion(newRot);
    }

    previewCamera.matrixNeedsUpdate = true;

    if (t >= 0.9999) {
      ranOnePass.set(eid, true);
      backwards.set(eid, !back);
      startTimes.set(eid, world.time.elapsed);
    }
  }
};

const scenePreviewCameraQuery = defineQuery([ScenePreviewCamera, Object3DTag]);
const scenePreviewCameraEnterQuery = enterQuery(scenePreviewCameraQuery);
const scenePreviewCameraExitQuery = exitQuery(scenePreviewCameraQuery);
// TODO Decouple this system from CameraSystem when that's migrated.
export function scenePreviewCameraSystem(world: HubsWorld, cameraSystem: CameraSystem) {
  scenePreviewCameraExitQuery(world).forEach(eid => {
    startPositions.delete(eid);
    startRotations.delete(eid);
    targetPositions.delete(eid);
    targetRotations.delete(eid);
    startTimes.delete(eid);
    backwards.delete(eid);
    ranOnePass.delete(eid);
  });
  scenePreviewCameraEnterQuery(world).forEach(eid => {
    const previewCamera = world.eid2obj.get(eid)!;

    cameraSystem.viewingCamera.position.copy(previewCamera.position);
    cameraSystem.viewingCamera.rotation.copy(previewCamera.rotation);
    cameraSystem.viewingCamera.rotation.reorder("YXZ");
    cameraSystem.viewingCamera.matrixNeedsUpdate = true;

    startPositions.set(eid, previewCamera.position.clone());

    const startRotation = previewCamera.quaternion.clone();
    startRotations.set(eid, startRotation);

    const targetPosition = previewCamera.position.clone();
    targetPosition.y = Math.max(targetPosition.y - 1.5, 1);
    targetPosition.add(new Vector3(2, 0, -2));
    targetPositions.set(eid, targetPosition);

    const targetRotDelta = new Euler(-0.15, 0.0, 0.15);
    const targetRotation = new Quaternion();
    targetRotation.setFromEuler(targetRotDelta);
    targetRotation.premultiply(startRotation);
    targetRotations.set(eid, targetRotation);

    startTimes.set(eid, world.time.elapsed);
    backwards.set(eid, false);
    ranOnePass.set(eid, false);
  });

  const entered = cameraSystem.viewingCamera && APP.scene?.is("entered")!;
  if (entered || cameraSystem.mode === CAMERA_MODE_INSPECT) return;

  scenePreviewCameraQuery(world).forEach(eid => {
    const previewCamera = world.eid2obj.get(eid)! as Camera;
    updatePreviewCamera(world, eid, previewCamera, cameraSystem);
    previewCamera.updateMatrices();
    setMatrixWorld(cameraSystem.viewingCamera, previewCamera.matrixWorld);
  });
}
