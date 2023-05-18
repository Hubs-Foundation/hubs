import { addComponent } from "bitecs";
import { Rigidbody } from "../bit-components";
import { HubsWorld } from "../app";
import { CONSTANTS } from "three-ammo";

export enum Type {
  STATIC = 0,
  DYNAMIC,
  KINEMATIC
}

export enum ActivationState {
  ACTIVE_TAG = 0,
  ISLAND_SLEEPING = 1,
  WANTS_DEACTIVATION = 2,
  DISABLE_DEACTIVATION = 3,
  DISABLE_SIMULATION = 4
}

export type RigidBodyParams = {
  type: Type;
  mass: number;
  gravity: [number, number, number];
  linearDamping: number;
  angularDamping: number;
  linearSleepingThreshold: number;
  angularSleepingThreshold: number;
  angularFactor: [number, number, number];
  activationState: ActivationState;
  emitCollisionEvents: boolean;
  disableCollision: boolean;
  collisionGroup: number;
  collisionMask: number;
  scaleAutoUpdate: boolean;
};

const DEFAULTS = {
  type: Type.DYNAMIC,
  mass: 1,
  gravity: [0, -9.8, 0],
  linearDamping: 0.01,
  angularDamping: 0.01,
  linearSleepingThreshold: 1.6,
  angularSleepingThreshold: 2.5,
  angularFactor: [1, 1, 1],
  activationState: ActivationState.ACTIVE_TAG,
  emitCollisionEvents: false,
  disableCollision: false,
  collisionGroup: 1,
  collisionMask: 1,
  scaleAutoUpdate: true
};

export const RIGID_BODY_FLAGS = {
  EMIT_COLLISION_EVENTS: 1 << 0,
  DISABLE_COLLISION: 1 << 1,
  SCALE_AUTO_UPDATE: 1 << 2
};

export const getTypeString = (eid: number) => {
  return Object.values(CONSTANTS.TYPE)[Rigidbody.type[eid]];
};

export const getActivationStateString = (eid: number) => {
  return Object.values(CONSTANTS.ACTIVATION_STATE)[Rigidbody.activationState[eid]];
};

export const getBodyFromRigidBody = (eid: number) => {
  return {
    mass: Rigidbody.mass[eid],
    gravity: { x: Rigidbody.gravity[eid][0], y: Rigidbody.gravity[eid][1], z: Rigidbody.gravity[eid][2] },
    linearDamping: Rigidbody.linearDamping[eid],
    angularDamping: Rigidbody.angularDamping[eid],
    linearSleepingThreshold: Rigidbody.linearSleepingThreshold[eid],
    angularSleepingThreshold: Rigidbody.angularSleepingThreshold[eid],
    angularFactor: {
      x: Rigidbody.angularFactor[eid][0],
      y: Rigidbody.angularFactor[eid][1],
      z: Rigidbody.angularFactor[eid][2]
    },
    activationState: getActivationStateString(eid),
    emitCollisionEvents: Rigidbody.flags[eid] & RIGID_BODY_FLAGS.EMIT_COLLISION_EVENTS,
    scaleAutoUpdate: Rigidbody.flags[eid] & RIGID_BODY_FLAGS.SCALE_AUTO_UPDATE,
    type: getTypeString(eid),
    disableCollision: Rigidbody.flags[eid] & RIGID_BODY_FLAGS.DISABLE_COLLISION,
    collisionFilterGroup: Rigidbody.collisionFilterGroup[eid],
    collisionFilterMask: Rigidbody.collisionFilterMask[eid]
  };
};

const updateRigidBody = (eid: number, params: RigidBodyParams) => {
  Rigidbody.type[eid] = params.type;
  Rigidbody.mass[eid] = params.mass;
  Rigidbody.gravity[eid].set(params.gravity);
  Rigidbody.linearDamping[eid] = params.linearDamping;
  Rigidbody.angularDamping[eid] = params.angularDamping;
  Rigidbody.linearSleepingThreshold[eid] = params.linearSleepingThreshold;
  Rigidbody.angularSleepingThreshold[eid] = params.angularSleepingThreshold;
  Rigidbody.angularFactor[eid].set(params.angularFactor);
  Rigidbody.activationState[eid] = params.activationState;
  params.emitCollisionEvents && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.EMIT_COLLISION_EVENTS);
  params.disableCollision && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.DISABLE_COLLISION);
  Rigidbody.collisionFilterGroup[eid] = params.collisionGroup;
  Rigidbody.collisionFilterMask[eid] = params.collisionMask;
  params.scaleAutoUpdate && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.SCALE_AUTO_UPDATE);
};

export const updateRigiBodyParams = (eid: number, params: Partial<RigidBodyParams>) => {
  const currentParams = getBodyFromRigidBody(eid);
  const bodyParams = Object.assign({}, currentParams, params);
  updateRigidBody(eid, bodyParams);
};

export function inflateRigidBody(world: HubsWorld, eid: number, params: Partial<RigidBodyParams>) {
  const bodyParams = Object.assign({}, DEFAULTS, params);

  addComponent(world, Rigidbody, eid);
  updateRigidBody(eid, bodyParams);

  return eid;
}
