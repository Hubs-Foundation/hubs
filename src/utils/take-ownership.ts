import { addComponent, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { AEntity, Networked, Owned } from "../bit-components";
import { getServerTime } from "../phoenix-adapter";
import type { EntityID } from "./networking-types";

export function takeOwnership(world: HubsWorld, eid: EntityID) {
  // TODO we do this to have a single API for taking ownership of things in new code, but it obviously relies on NAF/AFrame
  if (hasComponent(world, AEntity, eid)) {
    const el = world.eid2obj.get(eid)!.el!;
    !NAF.utils.isMine(el) && NAF.utils.takeOwnership(el);
  } else {
    addComponent(world, Owned, eid);
    Networked.lastOwnerTime[eid] = Math.max(getServerTime(), Networked.lastOwnerTime[eid] + 1);
    Networked.owner[eid] = APP.getSid(NAF.clientId);
  }
}
