import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { createMessageDatas } from "../bit-systems/networking";
import { PrefabName, prefabs } from "../prefabs/prefabs";
import { renderAsEntity } from "../utils/jsx-entity";
import { hasPermissionToSpawn } from "../utils/permissions";
import { takeOwnership } from "../utils/take-ownership";
import { setNetworkedDataWithRoot } from "./assign-network-ids";
import type { ClientID, InitialData } from "./networking-types";

export function createNetworkedEntity(world: HubsWorld, prefabName: PrefabName, initialData: InitialData) {
  if (!hasPermissionToSpawn(NAF.clientId, prefabName))
    throw new Error(`You do not have permission to spawn ${prefabName}`);
  const rootNid = NAF.utils.createNetworkId();
  const entity = createSoftOwnedNetworkedEntity(world, prefabName, initialData, rootNid, NAF.clientId);
  takeOwnership(world, entity);
  return entity;
}

export function createSoftOwnedNetworkedEntity(
  world: HubsWorld,
  prefabName: PrefabName,
  initialData: InitialData,
  rootNid: string,
  creator: ClientID
) {
  const eid = renderAsEntity(world, prefabs.get(prefabName)!.template(initialData));
  if (!hasComponent(world, Networked, eid)) {
    throw new Error("Networked prefabs must have the Networked component");
  }
  const obj = world.eid2obj.get(eid)!;
  createMessageDatas.set(eid, { prefabName, initialData });
  setNetworkedDataWithRoot(world, rootNid, eid, creator);
  AFRAME.scenes[0].object3D.add(obj);
  return eid;
}
