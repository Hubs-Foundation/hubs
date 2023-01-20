import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Billboard } from "../bit-components";

export enum BillboardFlags {
  ONLY_Y = 1 << 0,
  IN_VIEW = 1 << 1
}

export type BillboardParams = {
  onlyY: boolean;
};

export function inflateBillboard(world: HubsWorld, eid: number, params: BillboardParams) {
  params.onlyY && (Billboard.flags[eid] |= BillboardFlags.ONLY_Y);
  addComponent(world, Billboard, eid);
}
