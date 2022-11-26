import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { AEntity, Networked } from "../bit-components";
import type { EntityID } from "./networking-types";

export function setCreator(world: HubsWorld, eid: EntityID, creator: string) {
  if (hasComponent(world, AEntity, eid)) {
    throw new Error("Cannot use setCreator for AEntities");
  } else {
    Networked.creator[eid] = APP.getSid(creator);
  }
}
