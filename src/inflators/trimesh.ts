import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Trimesh } from "../bit-components";
import { Fit, inflatePhysicsShape, PhysicsShapeParams, Shape } from "./physics-shape";

export function inflateTrimesh(world: HubsWorld, eid: number) {
  addComponent(world, Trimesh, eid);
  inflatePhysicsShape(world, eid, {
    type: Shape.MESH,
    fit: Fit.ALL,
    includeInvisible: true,
    margin: 0.01
  } as PhysicsShapeParams);
}
