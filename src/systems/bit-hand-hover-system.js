import { addComponent, defineQuery, hasComponent, removeComponent } from "bitecs";
import { HandCollisionTarget, HoveredHandLeft, HoveredHandRight, Rigidbody } from "../bit-components";

function findHandCollisionTargetForHand(world, hand) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;

  // TODO physics system init is async so these don't get created right away.. They probably can be
  if (!hasComponent(world, Rigidbody, hand)) return;

  const handCollisions = physicsSystem.getCollisions(Rigidbody.bodyId[hand]);
  if (handCollisions) {
    for (let i = 0; i < handCollisions.length; i++) {
      const bodyData = physicsSystem.bodyUuidToData.get(handCollisions[i]);
      const object3D = bodyData && bodyData.object3D;
      if (object3D && hasComponent(world, HandCollisionTarget, object3D.eid)) {
        return object3D.eid;
      }
    }
  }

  return null;
}

function hoverHand(world, interactor, hoveredQuery, Component) {
  hoveredQuery(world).forEach(eid => removeComponent(world, Component, eid));
  const collision = findHandCollisionTargetForHand(world, interactor);
  if (collision) addComponent(world, Component, collision);
}

const leftHandHoveredQuery = defineQuery([HoveredHandLeft]);
const rightHandHoveredQuery = defineQuery([HoveredHandRight]);
export function handHoverSystem(world, legacyInteractionSystem) {
  const interactorSettings = legacyInteractionSystem.options;
  hoverHand(world, interactorSettings.leftHand.entity.object3D.eid, leftHandHoveredQuery, HoveredHandLeft);
  hoverHand(world, interactorSettings.rightHand.entity.object3D.eid, rightHandHoveredQuery, HoveredHandRight);
}
