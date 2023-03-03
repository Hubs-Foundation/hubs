import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { HeightField } from "../bit-components";
import { Fit, inflatePhysicsShape, PhysicsShapeParams, Shape } from "./physics-shape";

export type HeightFieldParams = {
  distance: number;
  offset: { x: number; y: number; z: number };
  data: number[];
};

export function inflateHeightField(world: HubsWorld, eid: number, params: HeightFieldParams) {
  addComponent(world, HeightField, eid);
  inflatePhysicsShape(world, eid, {
    type: Shape.HEIGHTFIELD,
    fit: Fit.MANUAL,
    margin: 0.01,
    offset: [params.offset.x, params.offset.y, params.offset.z],
    heightfieldDistance: params.distance,
    heightfieldData: params.data
  } as PhysicsShapeParams);
}
