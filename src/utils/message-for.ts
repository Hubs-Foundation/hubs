import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { createMessageDatas } from "../bit-systems/networking";
import { networkableComponents, schemas } from "./network-schemas";
import type { CursorBufferUpdateMessage, EntityID, Message, StorableUpdateMessage } from "./networking-types";
import { StorableMessage } from "./store-networked-state";

export function messageFor(
  world: HubsWorld,
  created: EntityID[],
  updated: EntityID[],
  needsFullSyncUpdate: EntityID[],
  deleted: EntityID[],
  isBroadcast: boolean
) {
  const message: Message = {
    creates: [],
    updates: [],
    deletes: []
  };

  created.forEach(eid => {
    const { prefabName, initialData } = createMessageDatas.get(eid)!;
    message.creates.push([APP.getString(Networked.id[eid])!, prefabName, initialData]);
  });

  updated.forEach(eid => {
    const updateMessage: CursorBufferUpdateMessage = {
      nid: APP.getString(Networked.id[eid])!,
      lastOwnerTime: Networked.lastOwnerTime[eid],
      timestamp: Networked.timestamp[eid],
      owner: APP.getString(Networked.owner[eid])!,
      creator: APP.getString(Networked.creator[eid])!,
      componentIds: [],
      data: []
    };
    const isFullSync = needsFullSyncUpdate.includes(eid);

    for (let j = 0; j < networkableComponents.length; j++) {
      const component = networkableComponents[j];
      if (hasComponent(world, component, eid)) {
        if (schemas.get(component)!.serialize(world, eid, updateMessage.data, isFullSync, isBroadcast)) {
          updateMessage.componentIds.push(j);
        }
      }
    }

    // TODO: If the owner/lastOwnerTime changed, we need to send this updateMessage
    if (updateMessage.componentIds.length) {
      message.updates.push(updateMessage);
    }
  });

  deleted.forEach(eid => {
    // TODO: We are reading component data of a deleted entity here.
    const nid = Networked.id[eid];
    message.deletes.push(APP.getString(nid)!);
  });

  if (message.creates.length || message.updates.length || message.deletes.length) {
    return message;
  }

  return null;
}

export function messageForStorage(world: HubsWorld, created: EntityID[], updated: EntityID[], deleted: EntityID[]) {
  const message: StorableMessage = {
    version: 1,
    creates: [],
    updates: [],
    deletes: []
  };

  created.forEach(eid => {
    const { prefabName, initialData } = createMessageDatas.get(eid)!;
    message.creates.push([APP.getString(Networked.id[eid])!, prefabName, initialData]);
  });

  updated.forEach(eid => {
    const updateMessage: StorableUpdateMessage = {
      nid: APP.getString(Networked.id[eid])!,
      lastOwnerTime: Networked.lastOwnerTime[eid],
      timestamp: Networked.timestamp[eid],
      owner: APP.getString(Networked.owner[eid])!,
      creator: APP.getString(Networked.creator[eid])!,
      data: {}
    };

    for (let j = 0; j < networkableComponents.length; j++) {
      const component = networkableComponents[j];
      if (hasComponent(world, component, eid)) {
        const schema = schemas.get(component)!;
        updateMessage.data[schema.componentName] = schema.serializeForStorage(eid);
      }
    }

    message.updates.push(updateMessage);
  });

  deleted.forEach(eid => {
    // TODO: We are reading component data of a deleted entity here.
    const nid = Networked.id[eid];
    message.deletes.push(APP.getString(nid)!);
  });

  if (message.creates.length || message.updates.length || message.deletes.length) {
    return message;
  }

  return null;
}
