import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { NetworkedMediaFrame, Networked, Owned, NetworkedTransform, AEntity } from "../bit-components";

import { CameraPrefab } from "../network-schemas/interactable-camera";
import { renderAsEntity } from "../utils/jsx-entity";

const prefabs = new Map([["camera", CameraPrefab]]);

export function takeOwnership(world, eid) {
  // TODO we do this to have a single API for taking ownership of things in new code, but it obviously relies on NAF/AFrame
  if (hasComponent(world, AEntity, eid)) {
    const el = world.eid2obj.get(eid).el;
    !NAF.utils.isMine(el) && NAF.utils.takeOwnership(el);
  } else {
    addComponent(world, Owned, eid);
    Networked.lastOwnerTime[eid] = Math.max(NAF.connection.getServerTime(), Networked.lastOwnerTime[eid] + 1);
    Networked.owner[eid] = APP.getSid(NAF.clientId);
  }
}

const createMessageDatas = new Map();

export function createNetworkedEntityFromRemote(world, prefabName, initialData, rootNid, creator, owner) {
  const eid = renderAsEntity(world, prefabs.get(prefabName)(initialData));
  const obj = world.eid2obj.get(eid);

  createMessageDatas.set(eid, { prefabName, initialData });

  let i = 0;
  obj.traverse(function(o) {
    if (o.eid && hasComponent(world, Networked, o.eid)) {
      const eid = o.eid;
      Networked.id[eid] = APP.getSid(i === 0 ? rootNid : `${rootNid}.${i}`);
      APP.world.nid2eid.set(Networked.id[eid], eid);
      Networked.creator[eid] = APP.getSid(creator);
      Networked.owner[eid] = APP.getSid(owner);
      if (NAF.clientId === creator) takeOwnership(world, eid);
      i += 1;
    }
  });

  AFRAME.scenes[0].object3D.add(obj);
  console.log("Spawning network object", prefabName, obj, eid);
  return eid;
}

export function createNetworkedEntity(world, prefabName, initialData) {
  const rootNid = NAF.utils.createNetworkId();
  return createNetworkedEntityFromRemote(world, prefabName, initialData, rootNid, NAF.clientId, NAF.clientId);
}

const networkedObjectsQuery = defineQuery([Networked]);
const enteredNetworkedObjectsQuery = enterQuery(networkedObjectsQuery);
const exitedNetworkedObjectsQuery = exitQuery(networkedObjectsQuery);
const ownedNetworkObjectsQuery = defineQuery([Networked, Owned]);

// TODO HACK gettting internal bitecs symbol, should expose createShadow
const $parentArray = Object.getOwnPropertySymbols(NetworkedMediaFrame.scale).find(s => s.description == "parentArray");
const $storeFlattened = Object.getOwnPropertySymbols(NetworkedMediaFrame).find(s => s.description == "storeFlattened");
export const createShadow = (store, key) => {
  if (!ArrayBuffer.isView(store)) {
    const shadowStore = store[$parentArray].slice(0);
    store[key] = store.map((_, eid) => {
      const { length } = store[eid];
      const start = length * eid;
      const end = start + length;
      return shadowStore.subarray(start, end);
    });
  } else {
    store[key] = store.slice(0);
  }
  return key;
};

// TODO this array encoding is silly, use a buffer once we are not sending JSON
function createSchema(Component) {
  const componentProps = Component[$storeFlattened];
  const shadowSymbols = componentProps.map((prop, i) => {
    return createShadow(prop, Symbol(`netshadow-${i}`));
  });

  return {
    serialize(_world, eid, data, isFullSync = false) {
      const changedPids = [];
      data.push(changedPids);
      for (let pid = 0; pid < componentProps.length; pid++) {
        const prop = componentProps[pid];
        const shadow = prop[shadowSymbols[pid]];
        // if property is an array
        if (ArrayBuffer.isView(prop[eid])) {
          for (let i = 0; i < prop[eid].length; i++) {
            if (isFullSync || shadow[eid][i] !== prop[eid][i]) {
              console.log("array changed");
              changedPids.push(pid);
              // TODO handle EID type and arrays of strings
              data.push(Array.from(prop[eid]));
              break;
            }
          }
          shadow[eid].set(prop[eid]);
        } else {
          if (isFullSync || shadow[eid] !== prop[eid]) {
            console.log("changed");
            changedPids.push(pid);
            // TODO handle EID type
            data.push(prop[$isStringType] ? APP.getString(prop[eid]) : prop[eid]);
          }
          shadow[eid] = prop[eid];
        }
      }
      if (!changedPids.length) {
        data.pop();
        return false;
      }
      return true;
    },
    deserialize(_world, eid, data) {
      const updatedPids = data[data.cursor++];
      for (let i = 0; i < updatedPids.length; i++) {
        const pid = updatedPids[i];
        const prop = componentProps[pid];
        const shadow = prop[shadowSymbols[pid]];
        // TODO updating the shadow here is slightly odd. Should taking ownership do it?
        if (ArrayBuffer.isView(prop[eid])) {
          prop[eid].set(data[data.cursor++]);
          shadow[eid].set(prop[eid]);
        } else {
          const val = data[data.cursor++];
          prop[eid] = prop[$isStringType] ? APP.getSid(val) : val;
          shadow[eid] = prop[eid];
        }
      }
    }
  };
}

const schemas = new Map([
  [NetworkedMediaFrame, createSchema(NetworkedMediaFrame)],
  [NetworkedTransform, createSchema(NetworkedTransform)]
]);

const networkableComponents = [NetworkedMediaFrame, NetworkedTransform];

const pendingMessages = [];
const pendingJoins = [];
const pendingParts = [];

// TODO messaging, joining, and leaving should not be using NAF
NAF.connection.subscribeToDataChannel("nn", function(_, _dataType, data) {
  pendingMessages.push(data);
});

document.addEventListener("DOMContentLoaded", function() {
  document.body.addEventListener("clientConnected", function({ detail: { clientId } }) {
    console.log("client joined", clientId);
    pendingJoins.push(APP.getSid(clientId));
  });
  document.body.addEventListener("clientDisconnected", function({ detail: { clientId } }) {
    console.log("client left", clientId);
    pendingParts.push(APP.getSid(clientId));
  });
});

function messageFor(world, created, updated, deleted, isFullSync) {
  const message = {
    creates: [],
    updates: [],
    deletes: []
  };

  created.forEach(eid => {
    message.creates.push(APP.getString(Networked.id[eid]));
    message.creates.push(APP.getString(Networked.creator[eid]));
    message.creates.push(APP.getString(Networked.owner[eid]));
    message.creates.push(createMessageDatas.get(eid));
  });

  updated.forEach(eid => {
    const updateMessage = {
      nid: APP.getString(Networked.id[eid]),
      lastOwnerTime: Networked.lastOwnerTime[eid],
      owner: APP.getString(Networked.owner[eid]), // This should always be NAF.clientId. If it's not, something bad happened
      creator: APP.getString(Networked.creator[eid]),
      componentIds: [],
      data: []
    };

    for (let j = 0; j < networkableComponents.length; j++) {
      const Component = networkableComponents[j];
      if (hasComponent(world, Component, eid)) {
        if (schemas.get(Component).serialize(world, eid, updateMessage.data, isFullSync)) {
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
    message.deletes.push(APP.getString(nid));
  });

  return message;
}

function isNetworkInstantiated(eid) {
  return createMessageDatas.has(eid);
}

const queuedBroadcasts = [];
export function applyNetworkUpdates(world) {
  {
    // Clients that left
    const networkedObjects = networkedObjectsQuery(world);
    for (let i = 0; i < pendingParts.length; i++) {
      const partingClientId = pendingParts[i];
      const toCreate = networkedObjects.filter(
        eid =>
          isNetworkInstantiated(eid) &&
          Networked.owner[eid] === partingClientId &&
          Networked.creator[eid] !== partingClientId
      );
      const toDelete = networkedObjects.filter(
        eid => isNetworkInstantiated(eid) && Networked.creator[eid] === partingClientId
      );
      // TODO: We are sending updates about things that may be deleted
      const toUpdate = networkedObjects.filter(eid => Networked.owner[eid] === partingClientId);
      toUpdate.forEach(eid => takeOwnership(world, eid));
      const message = messageFor(world, toCreate, toUpdate, [], true);

      if (message.creates.length || message.updates.length || message.deletes.length) {
        queuedBroadcasts.push(message);
      }

      toDelete.forEach(eid => removeEntity(world, eid));
    }
    pendingParts.length = 0;
  }

  const messagesToRevisit = {
    creates: [],
    updates: [],
    deletes: []
  };

  for (let i = 0; i < pendingMessages.length; i++) {
    const message = pendingMessages[i];

    for (let j = 0; j < message.creates.length; j += 4) {
      const nidString = message.creates[j];
      const creator = message.creates[j + 1];
      const owner = message.creates[j + 2];
      const { prefabName, initialData } = message.creates[j + 3];

      if (world.deletedNids.has(APP.getSid(nidString))) {
        console.log(`Received a create message for an object I've already deleted. Skipping ${nidString}`);
      } else if (world.nid2eid.has(APP.getSid(nidString))) {
        console.log(`Received create message for object I already created. Skipping ${nidString}`);
      } else {
        const eid = createNetworkedEntityFromRemote(world, prefabName, initialData, nidString, creator, owner);
        console.log("got create message for", nidString, eid);
      }
    }

    for (let j = 0; j < message.updates.length; j++) {
      const updateMessage = message.updates[j];
      const nid = APP.getSid(updateMessage.nid);

      if (world.deletedNids.has(nid)) {
        console.log(`Ignoring update for deleted entity ${updateMessage.nid}`);
        continue;
      }

      if (!world.nid2eid.has(nid)) {
        console.log(`Holding onto an update for ${updateMessage.nid} because we don't have it yet.`);
        // TODO: What if we will NEVER be able to apply this update?
        messagesToRevisit.updates.push(updateMessage);
        continue;
      }

      const eid = world.nid2eid.get(nid);

      if (
        Networked.lastOwnerTime[eid] > updateMessage.lastOwnerTime ||
        (Networked.lastOwnerTime[eid] === updateMessage.lastOwnerTime &&
          APP.getString(Networked.owner[eid]) < updateMessage.owner)
      ) {
        console.log(
          "Received update from an old owner, skipping",
          updateMessage.nid,
          Networked.lastOwnerTime[eid],
          updateMessage.lastOwnerTime
        );
        continue;
      }

      if (hasComponent(world, Owned, eid)) {
        if (updateMessage.owner === NAF.clientId) {
          // TODO: Should it be valid that we can receive a message where we are told we are the owner now?
          console.error("Got a message telling us we are the owner.");
        } else {
          console.log("Lost ownership: ", updateMessage.nid);
          removeComponent(world, Owned, eid);
        }
      }

      Networked.lastOwnerTime[eid] = updateMessage.lastOwnerTime;
      Networked.creator[eid] = APP.getSid(updateMessage.creator);
      Networked.owner[eid] = APP.getSid(updateMessage.owner);

      // TODO this is adding a property to an array
      updateMessage.data.cursor = 0;
      for (let s = 0; s < updateMessage.componentIds.length; s++) {
        const componentId = updateMessage.componentIds[s];
        const schema = schemas.get(networkableComponents[componentId]);
        schema.deserialize(world, eid, updateMessage.data);
      }
      delete updateMessage.data.cursor;
    }

    for (let j = 0; j < message.deletes.length; j += 1) {
      const nid = APP.getSid(message.deletes[j]);
      if (world.deletedNids.has(nid)) {
        continue;
      }
      world.deletedNids.add(nid);
      const eid = world.nid2eid.get(nid);
      removeEntity(world, eid);
      createMessageDatas.delete(eid);
      world.nid2eid.delete(nid);
      console.log("OK, deleting ", APP.getString(nid));
    }
  }

  pendingMessages.length = 0;
  if (messagesToRevisit.updates.length) {
    pendingMessages.push(messagesToRevisit);
  }

  // TODO If there's a scene owned object, we should take ownership of it
}

const TICK_RATE = 1000 / 12;
let nextNetworkTick = 0;

export function networkSendSystem(world) {
  if (performance.now() < nextNetworkTick) return;

  nextNetworkTick = performance.now() + TICK_RATE;

  queuedBroadcasts.forEach(message => {
    NAF.connection.broadcastDataGuaranteed("nn", message);
  });
  queuedBroadcasts.length = 0;

  // Clients that joined
  const ownedEntities = ownedNetworkObjectsQuery(world);
  if (pendingJoins.length) {
    const message = messageFor(world, ownedEntities.filter(isNetworkInstantiated), ownedEntities, [], true);
    for (const clientId of pendingJoins) {
      // send message to all new clients
      NAF.connection.sendDataGuaranteed(APP.getString(clientId), "nn", message);
    }
    pendingJoins.length = 0;
  }

  {
    const created = enteredNetworkedObjectsQuery(world).filter(
      eid => isNetworkInstantiated(eid) && Networked.creator[eid] === APP.getSid(NAF.clientId)
    );
    // TODO: Lots of people will send delete messages about the same object
    const deleted = exitedNetworkedObjectsQuery(world).filter(eid => {
      const nid = Networked.id[eid];
      return !world.deletedNids.has(nid) && isNetworkInstantiated(eid);
    });
    const message = messageFor(world, created, ownedEntities, deleted, false);

    // TODO: Need to send this message if network owner / ownertime changed.
    if (message.creates.length || message.updates.length || message.deletes.length) {
      // TODO we use NAF as a "dumb" transport here. This should happen in a better way
      NAF.connection.broadcastDataGuaranteed("nn", message);
    }

    deleted.forEach(eid => {
      createMessageDatas.delete(eid);
      const nid = Networked.id[eid];
      world.deletedNids.add(nid);
      world.nid2eid.delete(nid);
      console.log("OK, telling people to delete", APP.getString(nid));
    });
  }
}

// TODO: Handle disconnect and reconnect to the phoenix channel
// TODO: Handle blocking and unblocking people
// TODO: Handle permissions
