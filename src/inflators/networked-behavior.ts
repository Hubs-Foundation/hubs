import { addComponent } from "bitecs";
import { Networked, NetworkedBehavior } from "../bit-components";
import { HubsWorld } from "../app";

export function inflateNetworkedBehavior(world: HubsWorld, eid: number): number {
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedBehavior, eid);
  return eid;
}
