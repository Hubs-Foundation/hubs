import { HubsWorld } from "../app";
import { CONSTANTS } from "three-ammo";
import { inflatePhysicsShape } from "./physics-shape";
import { addComponent } from "bitecs";
import { AmmoShape } from "../bit-components";

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
  addComponent(world, AmmoShape, eid);
  inflatePhysicsShape(world, eid, {
    type: Object.values(CONSTANTS.SHAPE).indexOf(params.type as CONSTANTS.SHAPE),
    fit: Object.values(CONSTANTS.FIT).indexOf(params.fit as CONSTANTS.FIT),
    halfExtents: [params.halfExtents.x, params.halfExtents.y, params.halfExtents.z],
    minHalfExtent: params.minHalfExtent,
    maxHalfExtent: params.maxHalfExtent,
    sphereRadius: params.sphereRadius,
    offset: [params.offset.x, params.offset.y, params.offset.z],
    includeInvisible: params.includeInvisible
  });
}
