import { addComponent } from "bitecs";
import { Networked, NetworkedTransform } from "../bit-components";
import { HubsWorld } from "../app";

export function inflateNetworkedTransform(world: HubsWorld, eid: number): number {
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedTransform, eid);
  return eid;
}
