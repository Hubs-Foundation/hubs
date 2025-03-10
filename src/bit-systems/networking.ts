import { defineQuery } from "bitecs";
import { Networked } from "../bit-components";
import type {
  CreateMessageData,
  CreatorChange,
  EntityID,
  Message,
  NetworkID,
  StringID
} from "../utils/networking-types";
export let localClientID: StringID | null = null;
export function setLocalClientID(clientId: StringID) {
  connectedClientIds.add(clientId);
  localClientID = clientId;
}
export const createMessageDatas: Map<EntityID, CreateMessageData> = new Map();
export const networkedQuery = defineQuery([Networked]);
export const connectedClientIds = new Set<StringID>();
export const disconnectedClientIds = new Set<StringID>();
export const pendingMessages: Message[] = [];
export const pendingCreatorChanges: CreatorChange[] = [];
export const pendingJoins: StringID[] = [];
export const pendingParts: StringID[] = [];
export const softRemovedEntities = new Set<EntityID>();
export function isNetworkInstantiated(eid: EntityID) {
  return createMessageDatas.has(eid);
}

export function isPinned(eid: EntityID) {
  return Networked.creator[eid] === APP.getSid("reticulum");
}

export function isCreatedByMe(eid: EntityID) {
  return Networked.creator[eid] === APP.getSid(NAF.clientId);
}

const ticksPerSecond = 12;
export const millisecondsBetweenTicks = 1000 / ticksPerSecond;
