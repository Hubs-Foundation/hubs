import { HubsWorld } from "../../../app";
import { EntityID, Rigidbody } from "../../../bit-components";
import { BodyParams, Type, getBodyFromRigidBody } from "../../../inflators/rigid-body";
import { takeSoftOwnership } from "../../../utils/take-soft-ownership";

// TODO: Fix the type conversion.
export function setRigidBody(world: HubsWorld, eid: number, params: Partial<BodyParams>) {
  const physicsSystem = APP.scene?.systems["hubs-systems"].physicsSystem;
  physicsSystem.updateRigidBody(eid, params);
  if (Rigidbody.type[eid] === Type.DYNAMIC) {
    takeSoftOwnership(world, eid);
  }
}
export function getRigidBody(world: HubsWorld, eid: EntityID) {
  return getBodyFromRigidBody(eid);
}
