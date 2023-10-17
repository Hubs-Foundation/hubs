import { addComponent } from "bitecs";
import { Networked, NetworkedBehavior, NetworkedBehaviorData } from "../bit-components";
import { HubsWorld } from "../app";

type NetworkedBehaviorType = {
  [key: string]: {
    type: string;
    value: any;
  };
};

export function inflateNetworkedBehavior(world: HubsWorld, eid: number, params: NetworkedBehaviorType): number {
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedBehavior, eid);
  if (params) {
    const data = NetworkedBehaviorData.get(eid) || new Map();
    for (let key in params) {
      const type = params[key].type;
      const value = params[key].value;
      if (type === "integer") {
        data.set(key, BigInt(value));
      } else {
        data.set(key, value);
      }
    }
    NetworkedBehaviorData.set(eid, data);
  }
  return eid;
}
