import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import {
  HandLeft,
  HandRight,
  Held,
  HoverableVisuals,
  HoverableVisualsUniforms,
  HoveredHandLeft,
  HoveredHandRight,
  HoveredRemoteLeft,
  HoveredRemoteRight,
  Inspected,
  RemoteLeft,
  RemoteRight
} from "../bit-components";
import { injectCustomShaderChunks } from "../utils/media-utils";
import { anyEntityWith, findChildWithComponent } from "../utils/bit-utils";
import { EntityID } from "../utils/networking-types";
import { isPinned } from "./networking";

export const updateHoverableVisuals = (function () {
  const boundingBox = new THREE.Box3();
  const boundingSphere = new THREE.Sphere();
  return function (world: HubsWorld, eid: EntityID) {
    const obj = world.eid2obj.get(eid)!;

    HoverableVisualsUniforms.set(eid, injectCustomShaderChunks(obj));

    boundingBox.setFromObject(obj);
    boundingBox.getBoundingSphere(boundingSphere);
    HoverableVisuals.geometryRadius[eid] = boundingSphere.radius / obj.scale.y;
  };
})();

const sweepParams = [0, 0];
const interactorOneTransform = new Array();
const interactorTwoTransform = new Array();
const hoverableVisualsQuery = defineQuery([HoverableVisuals]);
const hoverableVisualsEnterQuery = enterQuery(hoverableVisualsQuery);
const hoverableVisualsExitQuery = exitQuery(hoverableVisualsQuery);
const isMobile = AFRAME.utils.device.isMobile();
const isThisMobileVR = AFRAME.utils.device.isMobileVR();
const isTouchscreen = isMobile && !isThisMobileVR;
export function hoverableVisualsSystem(world: HubsWorld) {
  hoverableVisualsExitQuery(world).forEach(eid => HoverableVisualsUniforms.delete(eid));
  hoverableVisualsEnterQuery(world).forEach(eid => updateHoverableVisuals(world, eid));
  hoverableVisualsQuery(world).forEach(eid => {
    const isInspecting = anyEntityWith(world, Inspected);
    const isFrozen = APP.scene!.is("frozen");
    const isEntityPinned = isPinned(eid);
    const showEffect = (!isEntityPinned && !isInspecting) || isFrozen;

    const uniforms = HoverableVisualsUniforms.get(eid);
    if (uniforms && uniforms.length) {
      const obj = world.eid2obj.get(eid)!;

      let interactorOne, interactorTwo;

      const hoveredHandLeft = findChildWithComponent(world, HoveredHandLeft, eid);
      const leftHand = anyEntityWith(world, HandLeft);
      if (leftHand) {
        if (hoveredHandLeft && !hasComponent(world, Held, leftHand)) {
          interactorOne = APP.world.eid2obj.get(leftHand);
        }
      }
      const hoveredRemoteLeft = findChildWithComponent(world, HoveredRemoteLeft, eid);
      const leftRemote = anyEntityWith(world, RemoteLeft);
      if (leftRemote) {
        if (hoveredRemoteLeft && !hasComponent(world, Held, hoveredRemoteLeft)) {
          interactorOne = APP.world.eid2obj.get(leftRemote);
        }
      }
      const hoveredHandRight = findChildWithComponent(world, HoveredHandRight, eid);
      const rightHand = anyEntityWith(world, HandRight);
      if (rightHand) {
        if (hoveredHandRight && !hasComponent(world, Held, hoveredHandRight)) {
          interactorTwo = APP.world.eid2obj.get(rightHand);
        }
      }
      const hoveredRemoteRight = findChildWithComponent(world, HoveredRemoteRight, eid);
      const rightRemote = anyEntityWith(world, RemoteRight);
      if (rightRemote) {
        if (hoveredRemoteRight && !hasComponent(world, Held, hoveredRemoteRight)) {
          interactorTwo = APP.world.eid2obj.get(rightRemote);
        }
      }

      if (interactorOne) {
        interactorOne.matrixWorld.toArray(interactorOneTransform);
      }
      if (interactorTwo) {
        interactorTwo.matrixWorld.toArray(interactorTwoTransform);
      }

      if (interactorOne || interactorTwo || isFrozen) {
        const worldY = obj.matrixWorld.elements[13];
        const ms1 = obj.matrixWorld.elements[4];
        const ms2 = obj.matrixWorld.elements[5];
        const ms3 = obj.matrixWorld.elements[6];
        const worldScale = Math.sqrt(ms1 * ms1 + ms2 * ms2 + ms3 * ms3);
        const scaledRadius = worldScale * HoverableVisuals.geometryRadius[eid];
        sweepParams[0] = worldY - scaledRadius;
        sweepParams[1] = worldY + scaledRadius;
      }

      const uniforms = HoverableVisualsUniforms.get(eid)! as any;
      for (let i = 0, l = uniforms.length; i < l; i++) {
        const uniform = uniforms[i];
        uniform.hubs_EnableSweepingEffect.value = showEffect;
        uniform.hubs_IsFrozen.value = isFrozen;
        uniform.hubs_SweepParams.value = sweepParams;

        uniform.hubs_HighlightInteractorOne.value = !!interactorOne && !isTouchscreen && showEffect;
        uniform.hubs_InteractorOnePos.value[0] = interactorOneTransform[12];
        uniform.hubs_InteractorOnePos.value[1] = interactorOneTransform[13];
        uniform.hubs_InteractorOnePos.value[2] = interactorOneTransform[14];

        uniform.hubs_HighlightInteractorTwo.value = !!interactorTwo && !isTouchscreen && showEffect;
        uniform.hubs_InteractorTwoPos.value[0] = interactorTwoTransform[12];
        uniform.hubs_InteractorTwoPos.value[1] = interactorTwoTransform[13];
        uniform.hubs_InteractorTwoPos.value[2] = interactorTwoTransform[14];

        if (interactorOne || interactorTwo || isFrozen) {
          uniform.hubs_Time.value = world.time.elapsed;
        }
      }
    }
  });
}
