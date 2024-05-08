import { addComponent } from "bitecs";
import { NetworkedRigidBody, Rigidbody } from "../bit-components";
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
  AVATARS = "avatars"
}

export enum ActivationState {
  ACTIVE_TAG = 0,
  ISLAND_SLEEPING = 1,
  WANTS_DEACTIVATION = 2,
  DISABLE_DEACTIVATION = 3,
  DISABLE_SIMULATION = 4
}

export type BodyParams = {
  type: string;
  mass: number;
  gravity: { x: number; y: number; z: number };
  linearDamping: number;
  angularDamping: number;
  linearSleepingThreshold: number;
  angularSleepingThreshold: number;
  angularFactor: { x: number; y: number; z: number };
  activationState: string;
  emitCollisionEvents: boolean;
  disableCollision: boolean;
  collisionFilterGroup: number;
  collisionFilterMask: number;
  scaleAutoUpdate: boolean;
};

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

export const getStringFromActivationState = (eid: number) => {
  return Object.values(CONSTANTS.ACTIVATION_STATE)[Rigidbody.activationState[eid]];
};

export const getActivationStateFromString = (activationState: string) => {
  switch (activationState) {
    case CONSTANTS.ACTIVATION_STATE.ACTIVE_TAG:
      return ActivationState.ACTIVE_TAG;
    case CONSTANTS.ACTIVATION_STATE.DISABLE_DEACTIVATION:
      return ActivationState.DISABLE_DEACTIVATION;
    case CONSTANTS.ACTIVATION_STATE.DISABLE_SIMULATION:
      return ActivationState.DISABLE_SIMULATION;
    case CONSTANTS.ACTIVATION_STATE.ISLAND_SLEEPING:
      return ActivationState.ISLAND_SLEEPING;
    case CONSTANTS.ACTIVATION_STATE.WANTS_DEACTIVATION:
      return ActivationState.WANTS_DEACTIVATION;
  }
  return ActivationState.ACTIVE_TAG;
};

export const getTypeFromBodyType = (type: string) => {
  switch (type) {
    case "static":
      return Type.STATIC;
    case "dynamic":
      return Type.DYNAMIC;
    case "kinematic":
      return Type.KINEMATIC;
  }
  return Type.KINEMATIC;
};

export const getBodyTypeFromType = (type: Type) => {
  switch (type) {
    case Type.STATIC:
      return "static";
    case Type.DYNAMIC:
      return "dynamic";
    case Type.KINEMATIC:
      return "kinematic";
  }
  return "kinematic";
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
    activationState: getStringFromActivationState(eid),
    emitCollisionEvents: (Rigidbody.flags[eid] & RIGID_BODY_FLAGS.EMIT_COLLISION_EVENTS) !== 0,
    scaleAutoUpdate: (Rigidbody.flags[eid] & RIGID_BODY_FLAGS.SCALE_AUTO_UPDATE) !== 0,
    type: getTypeString(eid),
    disableCollision: (Rigidbody.flags[eid] & RIGID_BODY_FLAGS.DISABLE_COLLISION) !== 0,
    collisionFilterGroup: Rigidbody.collisionFilterGroup[eid],
    collisionFilterMask: Rigidbody.collisionFilterMask[eid]
  };
};

export const updateBodyParams = (eid: number, params: Partial<BodyParams>) => {
  const currentParams = getBodyFromRigidBody(eid);
  const bodyParams = Object.assign({}, currentParams, params) as BodyParams;

  Rigidbody.type[eid] = getTypeFromBodyType(bodyParams.type);
  Rigidbody.mass[eid] = bodyParams.mass;
  Rigidbody.gravity[eid].set([bodyParams.gravity.x, bodyParams.gravity.y, bodyParams.gravity.z]);
  Rigidbody.linearDamping[eid] = bodyParams.linearDamping;
  Rigidbody.angularDamping[eid] = bodyParams.angularDamping;
  Rigidbody.linearSleepingThreshold[eid] = bodyParams.linearSleepingThreshold;
  Rigidbody.angularSleepingThreshold[eid] = bodyParams.angularSleepingThreshold;
  Rigidbody.angularFactor[eid].set([
    bodyParams.angularFactor.x,
    bodyParams.angularFactor.y,
    bodyParams.angularFactor.z
  ]);
  Rigidbody.activationState[eid] = getActivationStateFromString(params.activationState!);
  bodyParams.emitCollisionEvents && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.EMIT_COLLISION_EVENTS);
  bodyParams.disableCollision && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.DISABLE_COLLISION);
  Rigidbody.collisionFilterGroup[eid] = bodyParams.collisionFilterGroup;
  Rigidbody.collisionFilterMask[eid] = bodyParams.collisionFilterMask;
  bodyParams.scaleAutoUpdate && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.SCALE_AUTO_UPDATE);
};

export const updateRigidBodyParams = (eid: number, params: Partial<RigidBodyParams>) => {
  if (params.type !== undefined) {
    Rigidbody.type[eid] = params.type;
  }
  if (params.mass !== undefined) {
    Rigidbody.mass[eid] = params.mass;
  }
  if (params.gravity !== undefined) {
    Rigidbody.gravity[eid].set(params.gravity);
  }
  if (params.linearDamping !== undefined) {
    Rigidbody.linearDamping[eid] = params.linearDamping;
  }
  if (params.angularDamping !== undefined) {
    Rigidbody.angularDamping[eid] = params.angularDamping;
  }
  if (params.linearSleepingThreshold !== undefined) {
    Rigidbody.linearSleepingThreshold[eid] = params.linearSleepingThreshold;
  }
  if (params.angularSleepingThreshold !== undefined) {
    Rigidbody.angularSleepingThreshold[eid] = params.angularSleepingThreshold;
  }
  if (params.angularFactor !== undefined) {
    Rigidbody.angularFactor[eid].set(params.angularFactor);
  }
  if (params.activationState !== undefined) {
    Rigidbody.activationState[eid] = params.activationState;
  }
  if (params.emitCollisionEvents !== undefined) {
    Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.EMIT_COLLISION_EVENTS;
  }
  if (params.disableCollision !== undefined) {
    Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.DISABLE_COLLISION;
  }
  if (params.scaleAutoUpdate !== undefined) {
    Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.SCALE_AUTO_UPDATE;
  }
  if (params.collisionGroup !== undefined) {
    Rigidbody.collisionFilterGroup[eid] = params.collisionGroup;
  }
  if (params.collisionMask !== undefined) {
    Rigidbody.collisionFilterMask[eid] = params.collisionMask;
  }
};

export function inflateRigidBody(world: HubsWorld, eid: number, params: Partial<RigidBodyParams>) {
  const bodyParams = Object.assign({}, DEFAULTS, params) as RigidBodyParams;

  addComponent(world, Rigidbody, eid);
  addComponent(world, NetworkedRigidBody, eid);

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
  Rigidbody.initialCollisionFilterMask[eid] = bodyParams.collisionMask;
  bodyParams.scaleAutoUpdate && (Rigidbody.flags[eid] |= RIGID_BODY_FLAGS.SCALE_AUTO_UPDATE);
  NetworkedRigidBody.prevType[eid] = bodyParams.type;

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
  AVATARS = "avatars",
  MEDIA_FRAMES = "media-frames"
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
  [GLTFRigidBodyCollisionGroup.AVATARS]: COLLISION_LAYERS.AVATAR,
  [GLTFRigidBodyCollisionGroup.MEDIA_FRAMES]: COLLISION_LAYERS.MEDIA_FRAMES
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
