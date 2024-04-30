import { COLLISION_LAYERS } from "../constants";
import { exitQuery, defineQuery, removeComponent, hasComponent, entityExists } from "bitecs";
import {
  Held,
  HeldHandLeft,
  HeldHandRight,
  HeldRemoteLeft,
  HeldRemoteRight,
  Owned,
  Rigidbody,
  OffersRemoteConstraint,
  InteractableObject
} from "../bit-components";

// TODO this seems wrong, nothing sets it back unless its a floaty object
const exitOwned = exitQuery(defineQuery([Owned, OffersRemoteConstraint]));
const componentsToRemove = [Held, HeldHandRight, HeldHandLeft, HeldRemoteRight, HeldRemoteLeft];
const kinematicOptions = { type: "kinematic", collisionFilterMask: COLLISION_LAYERS.UNOWNED_INTERACTABLE };
export function onOwnershipLost(world) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;

  const entities = exitOwned(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    if (!entityExists(world, eid)) continue;
    for (let j = 0; j < componentsToRemove.length; j++) {
      const component = componentsToRemove[j];
      removeComponent(world, component, eid);
    }

    if (hasComponent(world, Rigidbody, eid)) {
      // TODO: If this system should only act on FloatyObjects we should express that
      // in the query instead of doing this.
      if (hasComponent(world, InteractableObject, eid)) {
        physicsSystem.updateRigidBody(eid, {
          type: "kinematic"
        });
      } else {
        physicsSystem.updateRigidBody(eid, kinematicOptions);
      }
    }
  }
}
