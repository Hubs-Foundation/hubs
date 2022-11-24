import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { HubsWorld } from "../app";
import { Networked, Owned } from "../bit-components";
import { createNetworkedEntityFromRemote } from "../utils/create-networked-entity";
import { networkableComponents, schemas } from "../utils/network-schemas";
import type { StringID, UpdateMessage } from "../utils/networking-types";
import { hasPermissionToSpawn } from "../utils/permissions";
import { takeOwnershipWithTime } from "../utils/take-ownership-with-time";
import {
  createMessageDatas,
  isNetworkInstantiated,
  localClientID,
  networkedQuery,
  pendingMessages,
  pendingParts
} from "./networking";

const partedClientIds = new Set<StringID>();
const storedUpdates = new Map<StringID, UpdateMessage[]>();
const enteredNetworkedQuery = enterQuery(defineQuery([Networked]));
export function networkReceiveSystem(world: HubsWorld) {
  if (!localClientID) return; // Not connected yet.

  {
    // When a user leaves, remove the entities created by that user
    const networkedEntities = networkedQuery(world);
    pendingParts.forEach(partingClientId => {
      partedClientIds.add(partingClientId);

      networkedEntities
        .filter(eid => isNetworkInstantiated(eid) && Networked.creator[eid] === partingClientId)
        .forEach(eid => removeEntity(world, eid));
    });
  }

  // If we were hanging onto updates for any newly created non network instantiated entities
  // we can now apply them. Network instantiated entities are handled when processing creates.
  enteredNetworkedQuery(world).forEach(eid => {
    const nid = Networked.id[eid];
    if (storedUpdates.has(nid)) {
      console.log("Had stored updates for", APP.getString(nid), storedUpdates.get(nid));
      const updates = storedUpdates.get(nid)!;

      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        if (partedClientIds.has(APP.getSid(update.owner))) {
          console.log("Rewriting update message from client who left.", JSON.stringify(update));
          update.owner = NAF.clientId;
          update.lastOwnerTime = update.timestamp;
        }
      }

      pendingMessages.unshift({ creates: [], updates, deletes: [] });
      storedUpdates.delete(nid);
    }
  });

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
        // TODO we may need to allow this for reconnects
        console.log(`Received a create message for an entity I've already deleted. Skipping ${nidString}`);
      } else if (world.nid2eid.has(nid)) {
        console.log(`Received create message for entity I already created. Skipping ${nidString}`);
      } else if (!hasPermissionToSpawn(creator, prefabName)) {
        // this should only ever happen if there is a bug or the sender is maliciously modified
        console.log(`Received create from a user who does not have permission to spawn ${prefabName}`);
        world.ignoredNids.add(nid); // TODO should we just use deletedNids for this?
      } else {
        const eid = createNetworkedEntityFromRemote(world, prefabName, initialData, nidString, creator, creator);
        console.log("got create message for", nidString, eid);

        // If we were hanging onto updates for this nid we can now apply them. And they should be processed before other updates.
        if (storedUpdates.has(nid)) {
          console.log("had pending updates for", nidString, storedUpdates.get(nid));
          Array.prototype.unshift.apply(message.updates, storedUpdates.get(nid));
          storedUpdates.delete(nid);
        }
      }
    }

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
        // TODO: What if we will NEVER be able to apply this update?
        // TODO would be nice if we could squash these updates
        const updates = storedUpdates.get(nid) || [];
        updates.push(updateMessage);
        storedUpdates.set(nid, updates);
        console.log(storedUpdates);
        continue;
      }

      const eid = world.nid2eid.get(nid)!;

      if (
        Networked.lastOwnerTime[eid] > updateMessage.lastOwnerTime ||
        (Networked.lastOwnerTime[eid] === updateMessage.lastOwnerTime &&
          APP.getString(Networked.owner[eid])! < updateMessage.owner) // arbitrary (but consistent) tiebreak
      ) {
        console.log(
          "Received update from an old owner, skipping",
          updateMessage.nid,
          Networked.lastOwnerTime[eid],
          updateMessage.lastOwnerTime
        );
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

      // TODO HACK simulating a buffer with a cursor using an array
      updateMessage.data.cursor = 0;
      for (let s = 0; s < updateMessage.componentIds.length; s++) {
        const componentId = updateMessage.componentIds[s];
        const schema = schemas.get(networkableComponents[componentId])!;
        schema.deserialize(world, eid, updateMessage.data);
      }
      delete updateMessage.data.cursor;
    }

    for (let j = 0; j < message.deletes.length; j += 1) {
      const nid = APP.getSid(message.deletes[j]);
      if (world.deletedNids.has(nid)) continue;

      world.deletedNids.add(nid);
      const eid = world.nid2eid.get(nid)!;
      createMessageDatas.delete(eid);
      world.nid2eid.delete(nid);
      removeEntity(world, eid);

      console.log("Deleting ", APP.getString(nid));
    }
  }
  pendingMessages.length = 0;

  {
    const networkedEntities = networkedQuery(world);
    pendingParts.forEach(partingClientId => {
      networkedEntities
        .filter(eid => Networked.owner[eid] === partingClientId)
        .forEach(eid => {
          takeOwnershipWithTime(world, eid, Networked.timestamp[eid]);
        });
    });

    pendingParts.length = 0;
  }

  // TODO If there's a scene-owned entity, we should take ownership of it
}
