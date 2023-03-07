import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { BoxCollider } from "../bit-components";
import { Fit, inflatePhysicsShape, Shape } from "./physics-shape";

export function inflateBoxCollider(world: HubsWorld, eid: number) {
  addComponent(world, BoxCollider, eid);
  inflatePhysicsShape(world, eid, {
    type: Shape.BOX,
    fit: Fit.MANUAL
  });
}
