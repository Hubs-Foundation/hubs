import { exitQuery, defineQuery, removeComponent, hasComponent, entityExists } from "bitecs";
import {
  Held,
  HeldHandLeft,
  HeldHandRight,
  HeldRemoteLeft,
  HeldRemoteRight,
  Owned,
  Rigidbody
} from "../bit-components";

// TODO this seems wrong, nothing sets it back unless its a floaty object
const exitOwned = exitQuery(defineQuery([Owned]));
const componentsToRemove = [Held, HeldHandRight, HeldHandLeft, HeldRemoteRight, HeldRemoteLeft];
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
      physicsSystem.updateRigidBody(eid, {
        type: "kinematic",
        collisionFilterMask: Rigidbody.initialCollisionFilterMask[eid]
      });
    }
  }
}
