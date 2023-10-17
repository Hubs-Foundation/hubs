import { addComponent } from "bitecs";
import { Networked, NetworkedMaterial } from "../bit-components";
import { HubsWorld } from "../app";

export const MaterialFlags = {
  TRANSPARENT: 1 << 0,
  TONE_MAPPED: 1 << 1,
  WIREFRAME: 1 << 2,
  FLAT_SHADED: 1 << 3,
  FOG: 1 << 4,
  DEPTH_WRITE: 1 << 4
};

export function inflateNetworkedMaterial(world: HubsWorld, eid: number): number {
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedMaterial, eid);

  return eid;
}
