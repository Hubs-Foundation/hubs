import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { UVScroll } from "../bit-components";

export interface UVScrollParams {
  speed: {
    x: number;
    y: number;
  };
  increment?: {
    x: number;
    y: number;
  };
}

export function inflateUVScroll(world: HubsWorld, eid: number, props: UVScrollParams) {
  addComponent(world, UVScroll, eid);
  UVScroll.speed[eid].set([props.speed.x, props.speed.y]);
  UVScroll.increment[eid].set([props.increment?.x || 0, props.increment?.y || 0]);
}
