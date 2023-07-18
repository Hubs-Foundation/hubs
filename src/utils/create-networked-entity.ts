import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { createMessageDatas } from "../bit-systems/networking";
import { MediaLoaderParams } from "../inflators/media-loader";
import { PrefabName, prefabs } from "../prefabs/prefabs";
import { renderAsEntity } from "../utils/jsx-entity";
import { hasPermissionToSpawn } from "../utils/permissions";
import { takeOwnership } from "../utils/take-ownership";
import { setNetworkedDataWithRoot } from "./assign-network-ids";
import type { ClientID, InitialData, NetworkID } from "./networking-types";

export function createNetworkedMedia(world: HubsWorld, initialData: MediaLoaderParams) {
  return createNetworkedEntity(world, "media", initialData);
}

export function createNetworkedEntity(world: HubsWorld, prefabName: PrefabName, initialData: InitialData) {
  if (!hasPermissionToSpawn(NAF.clientId, prefabName))
    throw new Error(`You do not have permission to spawn ${prefabName}`);
  const nid = NAF.utils.createNetworkId();
  const entity = renderAsNetworkedEntity(world, prefabName, initialData, nid, NAF.clientId);
  takeOwnership(world, entity);
  return entity;
}

export function renderAsNetworkedEntity(
  world: HubsWorld,
  prefabName: PrefabName,
  initialData: InitialData,
  nid: NetworkID,
  creator: ClientID
) {
  const eid = renderAsEntity(world, prefabs.get(prefabName)!.template(initialData));
  if (!hasComponent(world, Networked, eid)) {
    throw new Error("Networked prefabs must have the Networked component");
  }
  const obj = world.eid2obj.get(eid)!;
  createMessageDatas.set(eid, { prefabName, initialData });
  setNetworkedDataWithRoot(world, nid, eid, creator);
  AFRAME.scenes[0].object3D.add(obj);
  return eid;
}
