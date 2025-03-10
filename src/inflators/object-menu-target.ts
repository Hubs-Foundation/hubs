import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { EntityID } from "../utils/networking-types";
import { ObjectMenuTarget } from "../bit-components";

export const ObjectMenuTargetFlags = {
  Flat: 1 << 0
};

export type ObjectMenuTargetParams = {
  isFlat?: boolean;
};

const DEFAULTS = {
  isFlat: true
};

export function inflateObjectMenuTarget(world: HubsWorld, eid: EntityID, params: ObjectMenuTargetParams) {
  params = Object.assign({}, DEFAULTS, params);
  addComponent(world, ObjectMenuTarget, eid);
  if (params.isFlat === true) {
    ObjectMenuTarget.flags[eid] |= ObjectMenuTargetFlags.Flat;
  }
}
