import { defineQuery } from "bitecs";
import { Networked, Owned } from "../bit-components";
import type { ClientID, CreateMessageData, EntityID, Message, StringID } from "../utils/networking-types";
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
