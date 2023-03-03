import { addComponent } from "bitecs";
import { PhysicsShape } from "../bit-components";
import { HubsWorld } from "../app";
import { CONSTANTS } from "three-ammo";

export enum Shape {
  BOX = 0,
  CYLINDER,
  SPHERE,
  CAPSULE,
  CONE,
  HULL,
  HACD,
  VHACD,
  MESH,
  HEIGHTFIELD
}

export enum Fit {
  ALL = 0,
  MANUAL
}

export enum Axis {
  X = 0,
  Y,
  Z
}

export type PhysicsShapeParams = {
  shape: Shape;
  fit: Fit;
  halfExtents: [number, 3];
  minHalfExtent: number;
  maxHalfExtent: number;
  sphereRadius: number;
  cylinderAxis: Axis;
  margin: number;
  offset: [number, 3];
  orientation: [number, 4];
  includeInvisible: boolean;
};

const DEFAULTS = {
  shape: Shape.HULL,
  fit: Fit.ALL,
  halfExtents: [1, 1, 1],
  minHalfExtent: 0,
  maxHalfExtent: Number.POSITIVE_INFINITY,
  sphereRadius: NaN,
  cylinderAxis: Axis.Y,
  margin: 0.01,
  offset: [0, 0, 0],
  orientation: [0, 0, 0, 1],
  includeInvisible: false
};

const PHYSICS_SHAPE_FLAGS = {
  INCLUDE_INVISIBLE: 1 << 0
};

export const getShapeString = (eid: number) => {
  return Object.values(CONSTANTS.SHAPE)[PhysicsShape.shape[eid]];
};

export const getFitString = (eid: number) => {
  return Object.values(CONSTANTS.FIT)[PhysicsShape.fit[eid]];
};

export const getCylinderAxisString = (eid: number) => {
  switch (PhysicsShape.cylinderAxis[eid]) {
    case Axis.X:
      return "x";
    case Axis.Y:
      return "y";
    case Axis.Z:
      return "z";
  }
};

export const getShapeFromPhysicsShape = (eid: number) => {
  return {
    type: getShapeString(eid),
    fit: getFitString(eid),
    halfExtents: {
      x: PhysicsShape.halfExtents[eid][0],
      y: PhysicsShape.halfExtents[eid][1],
      z: PhysicsShape.halfExtents[eid][2]
    },
    minHalfExtent: PhysicsShape.minHalfExtent[eid],
    maxHalfExtent: PhysicsShape.maxHalfExtent[eid],
    sphereRadius: PhysicsShape.sphereRadius[eid],
    cylinderAxis: getCylinderAxisString(eid),
    margin: PhysicsShape.margin[eid],
    offset: {
      x: PhysicsShape.offset[eid][0],
      y: PhysicsShape.offset[eid][1],
      z: PhysicsShape.offset[eid][2]
    },
    orientation: {
      x: PhysicsShape.orientation[eid][0],
      y: PhysicsShape.orientation[eid][1],
      z: PhysicsShape.orientation[eid][2],
      w: PhysicsShape.orientation[eid][3]
    },
    includeInvisible: PhysicsShape.flags[eid] & PHYSICS_SHAPE_FLAGS.INCLUDE_INVISIBLE
  };
};

export const PhysicsShapes = (PhysicsShape as any).shapeIds as Map<number, Set<number>>;

export function inflatePhysicsShape(world: HubsWorld, eid: number, params: PhysicsShapeParams) {
  params = Object.assign({}, DEFAULTS, params);

  addComponent(world, PhysicsShape, eid);

  PhysicsShapes.set(eid, new Set<number>());
  PhysicsShape.shape[eid] = params.shape;
  PhysicsShape.fit[eid] = params.fit;
  PhysicsShape.halfExtents[eid].set(params.halfExtents);
  PhysicsShape.minHalfExtent[eid] = params.minHalfExtent;
  PhysicsShape.maxHalfExtent[eid] = params.maxHalfExtent;
  PhysicsShape.sphereRadius[eid] = params.sphereRadius;
  PhysicsShape.cylinderAxis[eid] = params.cylinderAxis;
  PhysicsShape.margin[eid] = params.margin;
  PhysicsShape.offset[eid].set(params.offset);
  PhysicsShape.orientation[eid].set(params.orientation);
  params.includeInvisible && (PhysicsShape.flags[eid] |= PHYSICS_SHAPE_FLAGS.INCLUDE_INVISIBLE);

  return eid;
}
