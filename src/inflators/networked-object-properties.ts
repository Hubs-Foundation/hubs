import { HubsWorld } from "../app";
import { inflateNetworkedTransform } from "./networked-transform";
import { inflateVisible } from "./visible";

export interface NetworkedObjectPropertiesParams {
  visible: boolean;
  transform: boolean;
}

const DEFAULTS = {
  visible: false,
  transform: false
};

export function inflateNetworkedObjectProperties(
  world: HubsWorld,
  eid: number,
  params: NetworkedObjectPropertiesParams
): number {
  params = Object.assign({}, DEFAULTS, params);
  if (params.transform) {
    inflateNetworkedTransform(world, eid);
  }
  if (params.visible) {
    inflateVisible(world, eid, params);
  }
  return eid;
}
