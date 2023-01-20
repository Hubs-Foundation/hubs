import { FrameSchedulerSystem } from "aframe";
import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { Box3, Frustum, Matrix4, Vector3, Mesh, Object3D, Camera } from "three";
import { HubsWorld } from "../app";
import { Billboard } from "../bit-components";

const billboardQuery = defineQuery([Billboard]);
const billboardEnterQuery = enterQuery(billboardQuery);
const billboardExitQuery = exitQuery(billboardQuery);

const isMobileVR = AFRAME.utils.device.isMobileVR();

const targetPos = new Vector3();
const worldPos = new Vector3();
const inView = new Map();

const updateIsInView = (world: HubsWorld, billboard: number) => {
  const frustum = new Frustum();
  const frustumMatrix = new Matrix4();
  const box = new Box3();
  const boxTemp = new Box3();

  const expandBox = (child: Mesh) => {
    if (child.geometry && child.geometry.boundingBox) {
      child.updateMatrices();
      child.geometry.computeBoundingBox();
      boxTemp.copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld);
      box.expandByPoint(boxTemp.min);
      box.expandByPoint(boxTemp.max);
    }
  };

  const isInViewOfCamera = (object3D: Object3D, camera: Camera) => {
    frustumMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(frustumMatrix);
    box.makeEmpty();
    object3D.traverse(expandBox);

    // NOTE: not using box.setFromObject here because text nodes do not have Z values in their geometry buffer,
    // and that routine ultimately assumes they do.
    return frustum.intersectsBox(box);
  };

  return () => {
    const object3D = world.eid2obj.get(billboard)!;
    if (!object3D.visible) {
      inView.set(billboard, false);
      return;
    }

    if (!APP.camera) return;

    const inVR = APP.scene?.is("vr-mode");
    inView.set(billboard, inVR ? true : isInViewOfCamera(object3D, APP.camera));
  };
};

let updateIsInViewCallback: (world: HubsWorld, billboard: number) => void;

// Billboard component that only updates visible objects and only those in the camera view on mobile VR.
// TODO billboarding assumes a single camera viewpoint but with video-texture-source, mirrors, and camera tools this is no longer valid
export function billboardSystem(world: HubsWorld, frameScheduler: FrameSchedulerSystem) {
  billboardEnterQuery(world).forEach(billboard => {
    if (isMobileVR) {
      updateIsInViewCallback = updateIsInView(world, billboard);
      frameScheduler.schedule(updateIsInViewCallback, "billboards");
    }
  });
  billboardExitQuery(world).forEach(billboard => {
    if (isMobileVR && updateIsInViewCallback) {
      frameScheduler.unschedule(updateIsInViewCallback, "billboards");
    }
  });
  billboardQuery(world).forEach(billboard => {
    const isInView = inView.get(billboard);
    if (isInView || !isMobileVR) {
      const object3D = world.eid2obj.get(billboard)!;
      const onlyY = Billboard.onlyY[billboard];

      const camera = APP.camera;
      if (camera) {
        // Set the camera world position as the target.
        targetPos.setFromMatrixPosition(camera.matrixWorld);

        if (onlyY) {
          object3D.getWorldPosition(worldPos);
          targetPos.y = worldPos.y;
        }
        object3D.lookAt(targetPos);

        object3D.matrixNeedsUpdate = true;
      }
    }
  });
}
