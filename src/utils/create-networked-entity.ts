import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { createMessageDatas } from "../bit-systems/networking";
import { PrefabName, prefabs } from "../prefabs/prefabs";
import { renderAsEntity } from "../utils/jsx-entity";
import { hasPermissionToSpawn } from "../utils/permissions";
import { takeOwnership } from "../utils/take-ownership";
import type { ClientID, InitialData } from "./networking-types";

export function createNetworkedEntity(world: HubsWorld, prefabName: PrefabName, initialData: InitialData) {
  if (!hasPermissionToSpawn(NAF.clientId, prefabName))
    throw new Error(`You do not have permission to spawn ${prefabName}`);
  const rootNid = NAF.utils.createNetworkId();
  return createNetworkedEntityFromRemote(world, prefabName, initialData, rootNid, NAF.clientId, NAF.clientId);
}

export function createNetworkedEntityFromRemote(
  world: HubsWorld,
  prefabName: PrefabName,
  initialData: InitialData,
  rootNid: string,
  creator: ClientID,
  owner: ClientID
) {
  const eid = renderAsEntity(world, prefabs.get(prefabName)!.template(initialData));
  const obj = world.eid2obj.get(eid)!;

  createMessageDatas.set(eid, { prefabName, initialData });

  let i = 0;
  obj.traverse(function (o) {
    if (o.eid && hasComponent(world, Networked, o.eid)) {
      const eid = o.eid;
      Networked.id[eid] = APP.getSid(i === 0 ? rootNid : `${rootNid}.${i}`);
      APP.world.nid2eid.set(Networked.id[eid], eid);
      Networked.creator[eid] = APP.getSid(creator);
      Networked.owner[eid] = APP.getSid(owner);
      if (NAF.clientId === owner) takeOwnership(world, eid);
      i += 1;
    }
  });

  AFRAME.scenes[0].object3D.add(obj);
  return eid;
}
