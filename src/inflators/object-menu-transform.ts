import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { EntityID } from "../utils/networking-types";
import { ObjectMenuTransform } from "../bit-components";

export const ObjectMenuTransformFlags = {
  Enabled: 1 << 0,
  Center: 1 << 1
};

export type ObjectMenuTransformParams = {
  center?: boolean;
};

const DEFAULTS = {
  center: true
};

export function inflateObjectMenuTransform(world: HubsWorld, eid: EntityID, params: ObjectMenuTransformParams) {
  params = Object.assign({}, DEFAULTS, params);
  addComponent(world, ObjectMenuTransform, eid);
  if (params.center === true) {
    ObjectMenuTransform.flags[eid] |= ObjectMenuTransformFlags.Center;
  }
}
