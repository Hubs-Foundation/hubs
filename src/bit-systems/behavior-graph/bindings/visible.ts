import { HubsWorld } from "../../../app";
import { EntityID } from "../../../bit-components";
import { VisibleParams } from "../../../inflators/visible";

export function setVisible(world: HubsWorld, eid: number, params: VisibleParams) {
  const obj = world.eid2obj.get(eid)!;
  obj.visible = params.visible;
}
export function getVisible(world: HubsWorld, eid: EntityID): VisibleParams {
  const obj = world.eid2obj.get(eid)!;
  return { visible: obj.visible };
}
