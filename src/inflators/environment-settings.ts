import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { EnvironmentSettings } from "../bit-components";

export function inflateEnvironmentSettings(world: HubsWorld, eid: number, props: any) {
  addComponent(world, EnvironmentSettings, eid);
  (EnvironmentSettings as any).map.set(eid, props);
}
