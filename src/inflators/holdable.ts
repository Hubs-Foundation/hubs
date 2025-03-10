import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Holdable } from "../bit-components";

export const HOLDABLE_FLAGS = {
  ENABLED: 1 << 0
};

export type HoldableParams = { enabled: boolean };
const defaults: HoldableParams = { enabled: true };
export function inflateHoldable(world: HubsWorld, eid: number, props?: HoldableParams) {
  props = Object.assign({}, defaults, props);

  addComponent(world, Holdable, eid);
  if (props.enabled !== false) {
    Holdable.flags[eid] |= HOLDABLE_FLAGS.ENABLED;
  } else {
    Holdable.flags[eid] &= ~HOLDABLE_FLAGS.ENABLED;
  }
}
