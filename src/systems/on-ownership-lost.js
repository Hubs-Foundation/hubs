const UNOWNED_INTERACTABLE = require("../constants").COLLISION_LAYERS.UNOWNED_INTERACTABLE;
import { exitQuery, defineQuery, removeComponent, hasComponent } from "bitecs";
import {
  Held,
  HeldHandLeft,
  HeldHandRight,
  HeldRemoteLeft,
  HeldRemoteRight,
  Owned,
  Rigidbody
} from "../bit-components";

const query = exitQuery(defineQuery([Owned]));
const componentsToRemove = [Held, HeldHandRight, HeldHandLeft, HeldRemoteRight, HeldRemoteLeft];
const kinematicOptions = { type: "kinematic", collisionFilterMask: UNOWNED_INTERACTABLE };
export function onOwnershipLost(world) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;

  const entities = query(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    for (let j = 0; j < componentsToRemove.length; j++) {
      const component = componentsToRemove[j];
      removeComponent(world, component, eid);
    }

    if (hasComponent(world, Rigidbody, eid)) {
      physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], kinematicOptions);
    }
  }
}
