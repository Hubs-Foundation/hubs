import { HubsWorld } from "../../../app";
import { EntityID } from "../../../bit-components";
import { BodyParams, getBodyFromRigidBody } from "../../../inflators/rigid-body";

// TODO: Fix the type conversion.
export function setRigidBody(world: HubsWorld, eid: number, params: Partial<BodyParams>) {
  const physicsSystem = APP.scene?.systems["hubs-systems"].physicsSystem;
  physicsSystem.updateRigidBody(eid, params);
}
export function getRigidBody(world: HubsWorld, eid: EntityID) {
  return getBodyFromRigidBody(eid);
}
