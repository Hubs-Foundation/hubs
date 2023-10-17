import { addComponent } from "bitecs";
import { Networked, NetworkedBehavior, NetworkedBehaviorData } from "../bit-components";
import { HubsWorld } from "../app";

type NetworkedBehaviorType = {
  [key: string]: any;
};

export function inflateNetworkedBehavior(world: HubsWorld, eid: number, params: NetworkedBehaviorType): number {
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedBehavior, eid);
  if (params) {
    const data = NetworkedBehaviorData.get(eid) || new Map();
    for (let key in params) {
      data.set(key, params[key]);
      NetworkedBehaviorData.set(eid, data);
    }
  }
  return eid;
}
