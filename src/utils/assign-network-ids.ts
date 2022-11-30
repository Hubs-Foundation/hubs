import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { EntityID, NetworkID } from "./networking-types";
import { takeOwnership } from "./take-ownership";

export function assignNetworkIds(world: HubsWorld, rootNid: NetworkID, mediaEid: EntityID, rootEid: EntityID) {
  let i = 0;
  world.eid2obj.get(mediaEid)!.traverse(function (obj) {
    if (obj.eid && hasComponent(world, Networked, obj.eid)) {
      const eid = obj.eid;
      Networked.id[eid] = APP.getSid(`${rootNid}.${i}`);
      APP.world.nid2eid.set(Networked.id[eid], eid);
      Networked.creator[eid] = APP.getSid(rootNid);
      Networked.owner[eid] = Networked.owner[rootEid];
      if (APP.getSid(NAF.clientId) === Networked.owner[rootEid]) takeOwnership(world, eid);
      i += 1;
    }
  });
}
