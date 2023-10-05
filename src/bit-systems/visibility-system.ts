import { defineQuery, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { NetworkedVisible, Owned, Visible } from "../bit-components";

const networkedVisibleQuery = defineQuery([Visible, NetworkedVisible]);
export function visibilitySystem(world: HubsWorld) {
  networkedVisibleQuery(world).forEach(eid => {
    if (hasComponent(world, Owned, eid)) {
      const obj = world.eid2obj.get(eid)!;
      Visible.visible[eid] = obj.visible ? 1 : 0;
      NetworkedVisible.visible[eid] = obj.visible ? 1 : 0;
    } else {
      const obj = world.eid2obj.get(eid)!;
      if (Number(obj.visible) !== NetworkedVisible.visible[eid]) {
        Visible.visible[eid] = NetworkedVisible.visible[eid];
        obj.visible = Boolean(NetworkedVisible.visible[eid]);
      }
    }
  });
}
