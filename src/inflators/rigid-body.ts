import { addComponent } from "bitecs";
import { Rigidbody } from "../bit-components";
import { HubsWorld } from "../app";
import { CONSTANTS } from "three-ammo";
import { COLLISION_LAYERS } from "../constants";

export enum Type {
  STATIC = 0,
  DYNAMIC,
  KINEMATIC
}

export enum CollisionGroup {
  OBJECTS = "objects",
  ENVIRONMENT = "environment",
  TRIGGERS = "triggers",
  AVATARS = "avatars"
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

export type BodyParams = {
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
  collisionFilterGroup: number;
  collisionFilterMask: number;
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

export const updateRigidBodyParams = (eid: number, params: Partial<BodyParams>) => {
  const currentParams = getBodyFromRigidBody(eid);
  const bodyParams = Object.assign({}, currentParams, params) as BodyParams;

  Rigidbody.type[eid] = bodyParams.type;
  Rigidbody.mass[eid] = bodyParams.mass;
  Rigidbody.gravity[eid].set(bodyParams.gravity);
  Rigidbody.linearDamping[eid] = bodyParams.linearDamping;
  Rigidbody.angularDamping[eid] = bodyParams.angularDamping;
  Rigidbody.linearSleepingThreshold[eid] = bodyParams.linearSleepingThreshold;
  Rigidbody.angularSleepingThreshold[eid] = bodyParams.angularSleepingThreshold;
  Rigidbody.angularFactor[eid].set(bodyParams.angularFactor);
  Rigidbody.activationState[eid] = bodyParams.activationState;
  bodyParams.emitCollisionEvents && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.EMIT_COLLISION_EVENTS);
  bodyParams.disableCollision && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.DISABLE_COLLISION);
  Rigidbody.collisionFilterGroup[eid] = bodyParams.collisionFilterGroup;
  Rigidbody.collisionFilterMask[eid] = bodyParams.collisionFilterMask;
  bodyParams.scaleAutoUpdate && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.SCALE_AUTO_UPDATE);
};

export function inflateRigidBody(world: HubsWorld, eid: number, params: Partial<RigidBodyParams>) {
  const bodyParams = Object.assign({}, DEFAULTS, params) as RigidBodyParams;

  addComponent(world, Rigidbody, eid);

  Rigidbody.type[eid] = bodyParams.type;
  Rigidbody.mass[eid] = bodyParams.mass;
  Rigidbody.gravity[eid].set(bodyParams.gravity);
  Rigidbody.linearDamping[eid] = bodyParams.linearDamping;
  Rigidbody.angularDamping[eid] = bodyParams.angularDamping;
  Rigidbody.linearSleepingThreshold[eid] = bodyParams.linearSleepingThreshold;
  Rigidbody.angularSleepingThreshold[eid] = bodyParams.angularSleepingThreshold;
  Rigidbody.angularFactor[eid].set(bodyParams.angularFactor);
  Rigidbody.activationState[eid] = bodyParams.activationState;
  bodyParams.emitCollisionEvents && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.EMIT_COLLISION_EVENTS);
  bodyParams.disableCollision && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.DISABLE_COLLISION);
  Rigidbody.collisionFilterGroup[eid] = bodyParams.collisionGroup;
  Rigidbody.collisionFilterMask[eid] = bodyParams.collisionMask;
  bodyParams.scaleAutoUpdate && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.SCALE_AUTO_UPDATE);

  return eid;
}

export enum GLTFRigidBodyType {
  STATIC = "static",
  DYNAMIC = "dynamic",
  KINEMATIC = "kinematic"
}

export enum GLTFRigidBodyCollisionGroup {
  OBJECTS = "objects",
  ENVIRONMENT = "environment",
  TRIGGERS = "triggers",
  AVATARS = "avatars"
}

const GLTF_DEFAULTS = {
  ...DEFAULTS,
  type: GLTFRigidBodyType.DYNAMIC,
  collisionGroup: GLTFRigidBodyCollisionGroup.OBJECTS,
  collisionMask: [GLTFRigidBodyCollisionGroup.AVATARS]
};

const gltfGroupToLayer = {
  [GLTFRigidBodyCollisionGroup.OBJECTS]: COLLISION_LAYERS.INTERACTABLES,
  [GLTFRigidBodyCollisionGroup.ENVIRONMENT]: COLLISION_LAYERS.ENVIRONMENT,
  [GLTFRigidBodyCollisionGroup.TRIGGERS]: COLLISION_LAYERS.TRIGGERS,
  [GLTFRigidBodyCollisionGroup.AVATARS]: COLLISION_LAYERS.AVATAR
} as const;

export interface GLTFRigidBodyParams
  extends Partial<Omit<RigidBodyParams, "type" | "collisionGroup" | "collisionMask">> {
  type?: GLTFRigidBodyType;
  collisionGroup?: GLTFRigidBodyCollisionGroup;
  collisionMask?: GLTFRigidBodyCollisionGroup[];
}

export function inflateGLTFRigidBody(world: HubsWorld, eid: number, params: GLTFRigidBodyParams) {
  const bodyParams = Object.assign({}, GLTF_DEFAULTS, params);

  inflateRigidBody(world, eid, {
    ...bodyParams,
    type: Object.values(GLTFRigidBodyType).indexOf(bodyParams.type),
    collisionGroup: gltfGroupToLayer[bodyParams.collisionGroup],
    collisionMask: bodyParams.collisionMask.reduce((acc, m) => acc | gltfGroupToLayer[m], 0)
  });

  return eid;
}
