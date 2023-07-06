import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Fit, inflatePhysicsShape, Shape } from "./physics-shape";
import { TrimeshTag } from "../bit-components";

export function inflateTrimesh(world: HubsWorld, eid: number) {
  inflatePhysicsShape(world, eid, {
    type: Shape.MESH,
    fit: Fit.ALL,
    includeInvisible: true,
    margin: 0.01
  });
  addComponent(world, TrimeshTag, eid);
}
