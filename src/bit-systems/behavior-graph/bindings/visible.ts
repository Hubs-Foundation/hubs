import { hasComponent } from "bitecs";
import { HubsWorld } from "../../../app";
import { EntityID, NetworkedVisible, Owned, Visible } from "../../../bit-components";
import { VisibleParams } from "../../../inflators/visible";

export function setVisible(world: HubsWorld, eid: number, params: VisibleParams) {
  const obj = world.eid2obj.get(eid)!;
  obj.visible = params.visible;

  if (hasComponent(world, NetworkedVisible, eid) && hasComponent(world, Owned, eid)) {
    const obj = world.eid2obj.get(eid)!;
    Visible.visible[eid] = obj.visible ? 1 : 0;
    NetworkedVisible.visible[eid] = obj.visible ? 1 : 0;
  }
}
export function getVisible(world: HubsWorld, eid: EntityID): VisibleParams {
  const obj = world.eid2obj.get(eid)!;
  return { visible: obj.visible };
}
