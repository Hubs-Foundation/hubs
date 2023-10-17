import { addComponent } from "bitecs";
import { Networked, NetworkedObjectMaterial } from "../bit-components";
import { HubsWorld } from "../app";

export function inflateNetworkedObjectMaterial(world: HubsWorld, eid: number): number {
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedObjectMaterial, eid);
  return eid;
}
