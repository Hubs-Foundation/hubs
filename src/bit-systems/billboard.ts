import { FrameSchedulerSystem } from "aframe";
import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { Box3, Frustum, Matrix4, Vector3, Object3D, Camera, Mesh } from "three";
import { HubsWorld } from "../app";
import { Billboard } from "../bit-components";
import { BillboardFlags } from "../inflators/billboard";

const billboardQuery = defineQuery([Billboard]);
const billboardEnterQuery = enterQuery(billboardQuery);
const billboardExitQuery = exitQuery(billboardQuery);

const isMobileVR = AFRAME.utils.device.isMobileVR();

const targetPos = new Vector3();
const worldPos = new Vector3();

const updateIsInView = (world: HubsWorld, billboard: number) => {
  const frustum = new Frustum();
  const frustumMatrix = new Matrix4();
  const box = new Box3();
  const boxTemp = new Box3();

  const expandBox = (child: Mesh) => {
    if (child.geometry) {
      child.updateMatrices();
      child.geometry.computeBoundingBox();
      boxTemp.copy(child.geometry.boundingBox!).applyMatrix4(child.matrixWorld);
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
      Billboard.flags[billboard] &= ~BillboardFlags.IN_VIEW;
      return;
    }

    if (!APP.camera) return;

    const inVR = APP.scene?.is("vr-mode");
    if (inVR || isInViewOfCamera(object3D, APP.camera)) {
      Billboard.flags[billboard] |= BillboardFlags.IN_VIEW;
    } else {
      Billboard.flags[billboard] &= ~BillboardFlags.IN_VIEW;
    }
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
    const flags = Billboard.flags[billboard];
    if (flags & BillboardFlags.IN_VIEW || !isMobileVR) {
      const object3D = world.eid2obj.get(billboard)!;

      const camera = APP.camera;
      if (camera) {
        // Set the camera world position as the target.
        targetPos.setFromMatrixPosition(camera.matrixWorld);

        if (flags & BillboardFlags.ONLY_Y) {
          object3D.getWorldPosition(worldPos);
          targetPos.y = worldPos.y;
        }
        object3D.lookAt(targetPos);

        object3D.matrixNeedsUpdate = true;
      }
    }
  });
}
