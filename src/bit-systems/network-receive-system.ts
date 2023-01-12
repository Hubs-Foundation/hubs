import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { HubsWorld } from "../app";
import { Networked, Owned } from "../bit-components";
import { renderAsNetworkedEntity } from "../utils/create-networked-entity";
import { networkableComponents, schemas, StoredComponent } from "../utils/network-schemas";
import type { ClientID, CursorBufferUpdateMessage, EntityID, StringID, UpdateMessage } from "../utils/networking-types";
import { hasPermissionToSpawn } from "../utils/permissions";
import { tryUnpin } from "../utils/store-networked-state";
import { takeSoftOwnership } from "../utils/take-soft-ownership";
import {
  createMessageDatas,
  isPinned,
  localClientID,
  networkedQuery,
  pendingMessages,
  pendingParts,
  softRemovedEntities
} from "./networking";

function isCursorBufferUpdateMessage(update: any): update is CursorBufferUpdateMessage {
  return !!update.hasOwnProperty("componentIds");
}

function breakTie(a: ClientID, b: ClientID) {
  if (a === "reticulum") return b;
  if (b === "reticulum") return a;
  // arbitrary (but consistent) tiebreak
  return a < b ? a : b;
}

function isOutdatedMessage(eid: EntityID, updateMessage: UpdateMessage) {
  if (!Networked.owner[eid]) return false;
  if (Networked.lastOwnerTime[eid] < updateMessage.lastOwnerTime) return false;
  if (Networked.lastOwnerTime[eid] > updateMessage.lastOwnerTime) return true;
  return updateMessage.owner !== breakTie(APP.getString(Networked.owner[eid])!, updateMessage.owner);
}

const partedClientIds = new Set<StringID>();
export const storedUpdates = new Map<StringID, UpdateMessage[]>();
const enteredNetworkedQuery = enterQuery(defineQuery([Networked]));

export function networkReceiveSystem(world: HubsWorld) {
  if (!localClientID) return; // Not connected yet.

  {
    // When a user leaves, remove the entities created by that user
    const networkedEntities = networkedQuery(world);
    pendingParts.forEach(partingClientId => {
      partedClientIds.add(partingClientId);

      networkedEntities
        .filter(eid => Networked.creator[eid] === partingClientId)
        .forEach(eid => {
          removeEntity(world, eid);
          // Don't send delete messages about these entities,
          // because the user might rejoin (and re-send creates
          // with the same network ids).
          softRemovedEntities.add(eid);
        });
    });
  }

  for (let i = 0; i < pendingMessages.length; i++) {
    const message = pendingMessages[i];

    for (let j = 0; j < message.deletes.length; j += 1) {
      const nid = APP.getSid(message.deletes[j]);
      if (world.deletedNids.has(nid)) continue;
      world.deletedNids.add(nid);

      const eid = world.nid2eid.get(nid);
      if (eid) {
        if (isPinned(eid)) {
          // We only expect this to happen if the client who sent the delete
          // didn't know it was pinned yet.
          console.warn("Told to delete a pinned entity. Unpinning it...");
          tryUnpin(world, eid, APP.hubChannel!);
        }

        createMessageDatas.delete(eid);
        world.nid2eid.delete(nid);
        removeEntity(world, eid);
        console.log("Deleting ", APP.getString(nid));
      }

      // TODO: Clear out any stored messages for this entity's children.
      //       If we did not create this entity and its children, then we
      //       can't rely on the threejs scene graph. Instead, we should be
      //       able to use network id prefixes in some way.
      storedUpdates.delete(nid);
    }
  }

  for (let i = 0; i < pendingMessages.length; i++) {
    const message = pendingMessages[i];

    for (let j = 0; j < message.creates.length; j++) {
      const [nidString, prefabName, initialData] = message.creates[j];
      const creator = message.fromClientId;
      if (!creator) {
        // We do not expect to get here.
        // We only check because we are synthesizing messages elsewhere;
        // They should not have any create messages in them.
        throw new Error("Received create message without a fromClientId.");
      }

      const nid = APP.getSid(nidString);

      if (world.deletedNids.has(nid)) {
        console.warn(`Received a create message for an entity I've already deleted. Skipping ${nidString}`);
        // TODO : Rebroadcast a delete for this nid, because a client must not have known about it.
        // This can happen in the unlikely case that the client who created this object disconnected as someone else deleted it.
        // The creator will send another create message when it reconnects.
      } else if (world.nid2eid.has(nid)) {
        console.warn(`Received create message for entity I already created. Skipping ${nidString}.`);
      } else if (world.ignoredNids.has(nid)) {
        console.warn(`Received create message for nid I ignored. Skipping ${nidString}.`);
      } else if (!hasPermissionToSpawn(creator, prefabName)) {
        // This should only happen if there is a bug or the sender is maliciously modified.
        console.warn(
          `Received create from a user who does not have permission to spawn ${prefabName}. Skipping ${nidString}.`
        );
        world.ignoredNids.add(nid);
      } else {
        const eid = renderAsNetworkedEntity(world, prefabName, initialData, nidString, creator);
        console.log(`Received create message for ${nidString}. (eid: ${eid})`);
      }
    }
  }

  // If we stored updates for newly created entities, queue them for processing
  enteredNetworkedQuery(world).forEach(eid => {
    const nid = Networked.id[eid];
    if (storedUpdates.has(nid)) {
      console.log("Had stored updates for", APP.getString(nid), storedUpdates.get(nid));
      const updates = storedUpdates.get(nid)!;

      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        if (partedClientIds.has(APP.getSid(update.owner))) {
          // We missed the frame when we would have taken soft ownership from this owner,
          // so modify the message to act as though we had done so.
          console.log("Rewriting update message from client who left.", JSON.stringify(update));
          update.owner = NAF.clientId;
          update.lastOwnerTime = update.timestamp + 1;
        }
      }

      // Process the stored message before other updates
      pendingMessages.unshift({ creates: [], updates, deletes: [] });
      storedUpdates.delete(nid);
    }
  });

  for (let i = 0; i < pendingMessages.length; i++) {
    const message = pendingMessages[i];

    for (let j = 0; j < message.updates.length; j++) {
      const updateMessage = message.updates[j];
      const nid = APP.getSid(updateMessage.nid);

      if (world.ignoredNids.has(nid)) {
        console.log(`Ignoring update for ignored entity ${updateMessage.nid}`);
        continue;
      }

      if (world.deletedNids.has(nid)) {
        console.log(`Ignoring update for deleted entity ${updateMessage.nid}`);
        continue;
      }

      if (!world.nid2eid.has(nid)) {
        console.log(`Holding onto an update for ${updateMessage.nid} because we don't have it yet.`);
        // TODO What if we will NEVER be able to apply this update?
        // TODO It would be nice if we could squash these updates
        const updates = storedUpdates.get(nid) || [];
        updates.push(updateMessage);
        storedUpdates.set(nid, updates);
        console.log(storedUpdates);
        continue;
      }

      const eid = world.nid2eid.get(nid)!;

      if (isOutdatedMessage(eid, updateMessage)) {
        continue;
      }

      if (updateMessage.owner === NAF.clientId) {
        console.log("Got a message telling us we are the owner.");
        addComponent(world, Owned, eid);
      } else if (hasComponent(world, Owned, eid)) {
        console.log("Lost ownership: ", updateMessage.nid);
        removeComponent(world, Owned, eid);
      }

      Networked.creator[eid] = APP.getSid(updateMessage.creator);
      Networked.owner[eid] = APP.getSid(updateMessage.owner);
      Networked.lastOwnerTime[eid] = updateMessage.lastOwnerTime;
      Networked.timestamp[eid] = updateMessage.timestamp;

      if (isCursorBufferUpdateMessage(updateMessage)) {
        // TODO HACK simulating a buffer with a cursor using an array
        updateMessage.data.cursor = 0;
        for (let s = 0; s < updateMessage.componentIds.length; s++) {
          const componentId = updateMessage.componentIds[s];
          const schema = schemas.get(networkableComponents[componentId])!;
          schema.deserialize(world, eid, updateMessage.data);
        }
        delete updateMessage.data.cursor;
      } else {
        // Slow path: Deserializing from stored messages.
        for (const schema of schemas.values()) {
          if (updateMessage.data.hasOwnProperty(schema.componentName)) {
            const storedComponent: StoredComponent = updateMessage.data[schema.componentName];
            schema.deserializeFromStorage(eid, storedComponent);
          }
        }
      }
    }
  }
  pendingMessages.length = 0;

  {
    const networkedEntities = networkedQuery(world);
    pendingParts.forEach(partingClientId => {
      networkedEntities
        .filter(eid => Networked.owner[eid] === partingClientId)
        .forEach(eid => takeSoftOwnership(world, eid));
    });

    pendingParts.length = 0;
  }
}
