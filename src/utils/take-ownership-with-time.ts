import { addComponent, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { AEntity, Networked, Owned } from "../bit-components";
import type { EntityID } from "./networking-types";

export function takeOwnershipWithTime(world: HubsWorld, eid: EntityID, timestamp: number) {
  if (hasComponent(world, AEntity, eid)) {
    throw new Error("Cannot take ownership of AEntities with a specific timestamp.");
  }
  if (timestamp < Networked.lastOwnerTime[eid]) {
    throw new Error("Cannot take ownership with timestamp less than latest ownership time.");
  }

  addComponent(world, Owned, eid);
  Networked.lastOwnerTime[eid] = timestamp;
  Networked.owner[eid] = APP.getSid(NAF.clientId);
}
