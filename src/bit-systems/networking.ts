import { defineQuery, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked, Owned } from "../bit-components";
import { renderAsEntity } from "../utils/jsx-entity";
import { takeOwnership } from "../utils/take-ownership";
import { PrefabName, prefabs } from "../prefabs/prefabs";
import { hasPermissionToSpawn } from "../utils/permissions";

export type EntityID = number;
type InitialData = any;
interface CreateMessageData {
  prefabName: PrefabName;
  initialData: InitialData;
}
export type ClientID = string;
type NetworkID = string;
export type StringID = number;
type CreateMessage = [networkId: NetworkID, prefabName: PrefabName, initialData: InitialData];
export type CursorBuffer = { cursor?: number; push: (data: any) => {} };
export type UpdateMessage = {
  nid: NetworkID;
  lastOwnerTime: number;
  timestamp: number;
  owner: ClientID;
  creator: ClientID;
  componentIds: number[];
  data: CursorBuffer;
};
type DeleteMessage = NetworkID;
export interface Message {
  fromClientId?: ClientID;
  creates: CreateMessage[];
  updates: UpdateMessage[];
  deletes: DeleteMessage[];
}

export let localClientID: ClientID | null = null;
export function setLocalClientID(clientID: ClientID) {
  localClientID = clientID;
}

export const createMessageDatas: Map<EntityID, CreateMessageData> = new Map();

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

export function createNetworkedEntity(world: HubsWorld, prefabName: PrefabName, initialData: InitialData) {
  if (!hasPermissionToSpawn(NAF.clientId, prefabName))
    throw new Error(`You do not have permission to spawn ${prefabName}`);
  const rootNid = NAF.utils.createNetworkId();
  return createNetworkedEntityFromRemote(world, prefabName, initialData, rootNid, NAF.clientId, NAF.clientId);
}

export const networkedEntitiesQuery = defineQuery([Networked]);
export const ownedNetworkedEntitiesQuery = defineQuery([Networked, Owned]);

export const pendingMessages: Message[] = [];
export const pendingJoins: StringID[] = [];
export const pendingParts: StringID[] = [];
export const partedClientIds = new Set<StringID>();

export function isNetworkInstantiated(eid: EntityID) {
  return createMessageDatas.has(eid);
}

export function isNetworkInstantiatedByMe(eid: EntityID) {
  return isNetworkInstantiated(eid) && Networked.creator[eid] === APP.getSid(NAF.clientId);
}
