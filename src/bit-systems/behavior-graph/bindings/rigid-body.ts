import { hasComponent } from "bitecs";
import { HubsWorld } from "../../../app";
import { EntityID, Networked } from "../../../bit-components";
import { BodyParams, getBodyFromRigidBody } from "../../../inflators/rigid-body";
import { updatePrevBodyType } from "../../../systems/bit-physics";
import { takeOwnership } from "../../../utils/take-ownership";

// TODO: Fix the type conversion.
export function setRigidBody(world: HubsWorld, eid: number, params: Partial<BodyParams>) {
  const physicsSystem = APP.scene?.systems["hubs-systems"].physicsSystem;
  physicsSystem.updateRigidBody(eid, params);
  updatePrevBodyType(world, eid);
  if (hasComponent(world, Networked, eid)) {
    takeOwnership(world, eid);
  }
}
export function getRigidBody(world: HubsWorld, eid: EntityID) {
  return getBodyFromRigidBody(eid);
}
