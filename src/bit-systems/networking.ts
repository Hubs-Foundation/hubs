import { defineQuery } from "bitecs";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { findAncestorEntity } from "../utils/bit-utils";
import type { ClientID, CreateMessageData, EntityID, Message, StringID } from "../utils/networking-types";
export let localClientID: ClientID | null = null;
export function setLocalClientID(clientID: ClientID) {
  localClientID = clientID;
}
export const createMessageDatas: Map<EntityID, CreateMessageData> = new Map();
export const networkedQuery = defineQuery([Networked]);
export const pendingMessages: Message[] = [];
export const pendingJoins: StringID[] = [];
export const pendingParts: StringID[] = [];
export const softRemovedEntities = new Set<EntityID>();
export function isNetworkInstantiated(eid: EntityID) {
  return createMessageDatas.has(eid);
}

export function isPinned(eid: EntityID) {
  return Networked.creator[eid] === APP.getSid("reticulum");
}

export function hasSavedEntityState(world: HubsWorld, eid: EntityID) {
  return !!findAncestorEntity(world, eid, ancestor => {
    return isNetworkInstantiated(ancestor) && isPinned(ancestor);
  });
}

export function isCreatedByMe(eid: EntityID) {
  return Networked.creator[eid] === APP.getSid(NAF.clientId);
}
