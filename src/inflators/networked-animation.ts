import { addComponent } from "bitecs";
import { Networked, NetworkedAnimation } from "../bit-components";
import { HubsWorld } from "../app";

export function inflateNetworkedAnimation(world: HubsWorld, eid: number): number {
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedAnimation, eid);
  return eid;
}
