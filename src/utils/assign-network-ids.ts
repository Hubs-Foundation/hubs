import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { ClientID, EntityID, NetworkID } from "./networking-types";

export function setNetworkedDataWithRoot(world: HubsWorld, rootNid: NetworkID, eid: EntityID, creator: ClientID) {
  let i = 0;
  world.eid2obj.get(eid)!.traverse(function (o) {
    if (o.eid && hasComponent(world, Networked, o.eid)) {
      // TODO: Should non-root's creator just be "reticulum"?
      setInitialNetworkedData(o.eid, i === 0 ? rootNid : `${rootNid}.${i}`, i === 0 ? creator : rootNid);
      i += 1;
    }
  });
}

export function setNetworkedDataWithoutRoot(world: HubsWorld, rootNid: NetworkID, childEid: EntityID) {
  let i = 0;
  // TODO: Should creator just be "reticulum"?
  world.eid2obj.get(childEid)!.traverse(function (obj) {
    if (obj.eid && hasComponent(world, Networked, obj.eid)) {
      setInitialNetworkedData(obj.eid, `${rootNid}.${i}`, rootNid);
      i += 1;
    }
  });
}

type CreatorID = NetworkID | ClientID;
export function setInitialNetworkedData(eid: EntityID, nid: NetworkID, creator: CreatorID) {
  Networked.id[eid] = APP.getSid(nid);
  APP.world.nid2eid.set(Networked.id[eid], eid);
  Networked.creator[eid] = APP.getSid(creator);
  Networked.owner[eid] = APP.getSid("reticulum");
  Networked.lastOwnerTime[eid] = 0;
}
