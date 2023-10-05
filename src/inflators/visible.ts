import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked, NetworkedVisible, Visible } from "../bit-components";

export interface VisibleParams {
  visible: boolean;
}

const DEFAULTS = {
  visible: true
};

export function inflateVisible(world: HubsWorld, eid: number, params: VisibleParams) {
  params = Object.assign({}, DEFAULTS, params);
  addComponent(world, Visible, eid);
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedVisible, eid);

  Visible.visible[eid] = Number(params.visible);
  NetworkedVisible.visible[eid] = Number(params.visible);
}
