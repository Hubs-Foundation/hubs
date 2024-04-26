import { Capturable, CapturableObject } from "../bit-components";
import { addComponent } from "bitecs";

export function inflateCapturable(world, eid) {
  addComponent(world, Capturable, eid, true);
  addComponent(world, CapturableObject, eid, true);
}
