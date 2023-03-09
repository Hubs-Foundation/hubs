import { HubsWorld } from "../app";
import { Fit, inflatePhysicsShape, Shape } from "./physics-shape";

export function inflateBoxCollider(world: HubsWorld, eid: number) {
  inflatePhysicsShape(world, eid, {
    type: Shape.BOX,
    fit: Fit.MANUAL
  });
}
