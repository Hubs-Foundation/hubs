import { HubsWorld } from "../app";
import { CONSTANTS } from "three-ammo";
import { inflatePhysicsShape, PhysicsShapeParams } from "./physics-shape";
import { inflateRigidBody, RigiBodyParams, Type } from "./rigid-body";

export type AmmoShapeParams = {
  type: string;
  fit: string;
  halfExtents: { x: number; y: number; z: number };
  minHalfExtent: number;
  maxHalfExtent: number;
  sphereRadius: number;
  offset: { x: number; y: number; z: number };
  includeInvisible: boolean;
};

export function inflateAmmoShape(world: HubsWorld, eid: number, params: AmmoShapeParams) {
  inflateRigidBody(world, eid, { type: Type.STATIC } as RigiBodyParams);
  inflatePhysicsShape(world, eid, {
    shape: Object.values(CONSTANTS.SHAPE).indexOf(params.type as CONSTANTS.SHAPE),
    fit: Object.values(CONSTANTS.FIT).indexOf(params.fit as CONSTANTS.FIT),
    halfExtents: [params.halfExtents.x, params.halfExtents.y, params.halfExtents.z],
    minHalfExtent: params.minHalfExtent,
    maxHalfExtent: params.maxHalfExtent,
    sphereRadius: params.sphereRadius,
    offset: [params.offset.x, params.offset.y, params.offset.z],
    includeInvisible: params.includeInvisible
  } as PhysicsShapeParams);
}
