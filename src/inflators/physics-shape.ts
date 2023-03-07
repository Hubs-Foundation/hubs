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
  type: Shape;
  fit: Fit;
  halfExtents: [number, number, number];
  minHalfExtent: number;
  maxHalfExtent: number;
  sphereRadius: number;
  cylinderAxis: Axis;
  margin: number;
  offset: [number, number, number];
  orientation: [number, number, number, number];
  heightfieldData: number[];
  heightfieldDistance: number;
  includeInvisible: boolean;
};

const DEFAULTS = {
  type: Shape.HULL,
  fit: Fit.ALL,
  halfExtents: [1, 1, 1],
  minHalfExtent: 0,
  maxHalfExtent: Number.POSITIVE_INFINITY,
  sphereRadius: NaN,
  cylinderAxis: Axis.Y,
  margin: 0.01,
  offset: [0, 0, 0],
  orientation: [0, 0, 0, 1],
  heightfieldData: [],
  heightfieldDistance: 1,
  includeInvisible: false
};

export const PHYSICS_SHAPE_FLAGS = {
  INCLUDE_INVISIBLE: 1 << 0
};

const getTypeString = (eid: number) => {
  return Object.values(CONSTANTS.SHAPE)[PhysicsShape.type[eid]];
};

const getFitString = (eid: number) => {
  return Object.values(CONSTANTS.FIT)[PhysicsShape.fit[eid]];
};

const getCylinderAxisString = (eid: number) => {
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
    type: getTypeString(eid),
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
    heightfieldData: PhysicsShape.heightfieldData[eid],
    heightfieldDistance: PhysicsShape.heightfieldDistance[eid],
    includeInvisible: PhysicsShape.flags[eid] & PHYSICS_SHAPE_FLAGS.INCLUDE_INVISIBLE
  };
};

export function inflatePhysicsShape(world: HubsWorld, eid: number, params: Partial<PhysicsShapeParams>) {
  const shapeParams = Object.assign({}, DEFAULTS, params);

  addComponent(world, PhysicsShape, eid);

  PhysicsShape.type[eid] = shapeParams.type;
  PhysicsShape.fit[eid] = shapeParams.fit;
  PhysicsShape.halfExtents[eid].set(shapeParams.halfExtents);
  PhysicsShape.minHalfExtent[eid] = shapeParams.minHalfExtent;
  PhysicsShape.maxHalfExtent[eid] = shapeParams.maxHalfExtent;
  PhysicsShape.sphereRadius[eid] = shapeParams.sphereRadius;
  PhysicsShape.cylinderAxis[eid] = shapeParams.cylinderAxis;
  PhysicsShape.margin[eid] = shapeParams.margin;
  PhysicsShape.offset[eid].set(shapeParams.offset);
  PhysicsShape.heightfieldData[eid] = shapeParams.heightfieldData.slice();
  PhysicsShape.heightfieldDistance[eid] = shapeParams.heightfieldDistance;
  PhysicsShape.orientation[eid].set(shapeParams.orientation);
  params.includeInvisible && (PhysicsShape.flags[eid] |= PHYSICS_SHAPE_FLAGS.INCLUDE_INVISIBLE);

  return eid;
}
