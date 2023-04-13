import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { CustomTags } from "../bit-components";

export type CustomTagParams = { tags: string[] };
export function inflateCustomTags(world: HubsWorld, eid: number, props: Partial<CustomTagParams> = {}) {
  addComponent(world, CustomTags, eid);
  CustomTags.tags.set(eid, props.tags || []);
}
