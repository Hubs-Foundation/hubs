import { defineQuery, hasComponent } from "bitecs";
import { NetworkedVisible, Owned, Visible } from "../../../bit-components";
import { HubsWorld } from "../../../app";

const networkedVisibleQuery = defineQuery([Visible, NetworkedVisible]);
export function visibilitySystem(world: HubsWorld) {
  networkedVisibleQuery(world).forEach(eid => {
    if (!hasComponent(world, Owned, eid)) {
      const obj = world.eid2obj.get(eid)!;
      if (Number(obj.visible) !== NetworkedVisible.visible[eid]) {
        Visible.visible[eid] = NetworkedVisible.visible[eid];
        obj.visible = Boolean(NetworkedVisible.visible[eid]);
      }
    }
  });
}
