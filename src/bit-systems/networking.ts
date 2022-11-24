import { defineQuery } from "bitecs";
import { Networked, Owned } from "../bit-components";
import { PrefabName } from "../prefabs/prefabs";

export type EntityID = number;
export type InitialData = any;
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
