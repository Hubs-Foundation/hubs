import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent } from "bitecs";
import { NetworkedMediaFrame, Networked, Owned, NetworkedTransform, AEntity } from "../bit-components";

import { CameraPrefab } from "../network-schemas/interactable-camera";
import { renderAsEntity } from "../utils/jsx-entity";

const prefabs = new Map([["camera", CameraPrefab]]);

const createMessageDatas = new Map();

export function createNetworkedEntity(world, prefabName, initialData) {
  const eid = renderAsEntity(world, prefabs.get(prefabName)(initialData));

  createMessageDatas.set(eid, { prefabName, initialData });

  addComponent(world, Networked, eid);
  Networked.id[eid] = APP.getSid(NAF.utils.createNetworkId());
  APP.world.nid2eid.set(Networked.id[eid], eid);
  Networked.creator[eid] = APP.getSid(NAF.clientId);
  Networked.owner[eid] = APP.getSid(NAF.clientId);

  takeOwnership(world, eid);

  const obj = world.eid2obj.get(eid);
  AFRAME.scenes[0].object3D.add(obj);

  console.log("Spawning network object", prefabName, obj, eid);

  return eid;
}

export function createNetworkedEntityFromRemote(world, prefabName, initialData) {
  const eid = renderAsEntity(world, prefabs.get(prefabName)(initialData));

  createMessageDatas.set(eid, { prefabName, initialData });

  const obj = world.eid2obj.get(eid);
  AFRAME.scenes[0].object3D.add(obj);
  console.log("Spawning network object", prefabName, obj, eid);
  return eid;
}

const networkedObjectsQuery = defineQuery([Networked]);
const enteredNetworkedObjectsQuery = enterQuery(networkedObjectsQuery);
const ownedNetworkObjectsQuery = defineQuery([Networked, Owned]);

export const TEMPLATE_ID_LEGACY_NAF = 1;
export const TEMPLATE_ID_MEDIA_FRAME = 2;
const schemas = new Map([
  [
    NetworkedMediaFrame,
    {
      serialize(world, eid, data) {
        // TODO: Just "serialize this component: NetworkedMediaFrame and determine changes"
        data.push({
          capturedNid: APP.getString(NetworkedMediaFrame.capturedNid[eid]),
          scale: Array.from(NetworkedMediaFrame.scale[eid])
        });
      },

      deserialize(world, frameEid, update) {
        // TODO: Just "deserialize this component of a known shape: NetworkedMediaFrame"
        NetworkedMediaFrame.capturedNid[frameEid] = APP.getSid(update.capturedNid);
        NetworkedMediaFrame.scale[frameEid].set(update.scale);
        return;
      }
    }
  ],
  [
    NetworkedTransform,
    {
      serialize(world, eid, data) {
        data.push({
          position: Array.from(NetworkedTransform.position[eid])
        });
      },

      deserialize(world, eid, update) {
        NetworkedTransform.position[eid].set(update.position);
        return;
      }
    }
  ]
]);
const networkableComponents = [NetworkedMediaFrame, NetworkedTransform];

export function takeOwnership(world, eid) {
  // TODO we do this to have a single API for taking ownership of things in new code, but it obviously relies on NAF/AFrame
  if (hasComponent(world, AEntity, eid)) {
    const el = world.eid2obj.get(eid).el;
    !NAF.utils.isMine(el) && NAF.utils.takeOwnership(el);
  } else {
    addComponent(world, Owned, eid);
    Networked.lastOwnerTime[eid] = Math.max(NAF.connection.getServerTime(), Networked.lastOwnerTime[eid] + 1);
  }
}

const pendingMessages = [];
NAF.connection.subscribeToDataChannel("nn", function(_, _dataType, data) {
  pendingMessages.push(data);
});

export function applyNetworkUpdates(world) {
  const messagesToRevisit = {
    creates: [],
    updates: [],
    deletes: []
  };

  for (let i = 0; i < pendingMessages.length; i++) {
    const message = pendingMessages[i];

    for (let j = 0; j < message.creates.length; j += 4) {
      const nid = message.creates[j];
      const creator = message.creates[j + 1];
      const owner = message.creates[j + 2];
      const { prefabName, initialData } = message.creates[j + 3];

      const eid = createNetworkedEntityFromRemote(world, prefabName, initialData);
      console.log("got create message for", nid, eid);

      addComponent(world, Networked, eid);
      Networked.id[eid] = APP.getSid(nid);
      APP.world.nid2eid.set(Networked.id[eid], eid);
      Networked.creator[eid] = APP.getSid(creator);
      Networked.owner[eid] = APP.getSid(owner);
    }

    for (let j = 0; j < message.updates.length; j++) {
      const updateMessage = message.updates[j];
      const nid = APP.getSid(updateMessage.nid);

      if (!world.nid2eid.has(nid)) {
        console.log(`Holding onto an update for ${updateMessage.nid} because we don't have it yet.`);
        // TODO: What if we will NEVER be able to apply this update?
        // messagesToRevisit.updates.push(updateMessage);
        continue;
      }

      const eid = world.nid2eid.get(nid);

      if (Networked.lastOwnerTime[eid] > updateMessage.lastOwnerTime) {
        console.log("Received update from an old owner, skipping", updateMessage.nid);
        continue;
      }

      // TODO handle tiebreak
      if (hasComponent(world, Owned, eid) && updateMessage.lastOwnerTime > Networked.lastOwnerTime[eid]) {
        console.log("Lost ownership: ", updateMessage.nid);
        removeComponent(world, Owned, eid);
      }

      Networked.lastOwnerTime[eid] = updateMessage.lastOwnerTime;

      let cursor = 0;
      for (let s = 0; s < updateMessage.componentIds.length; s++) {
        const componentId = updateMessage.componentIds[s];
        const schema = schemas.get(networkableComponents[componentId]);
        schema.deserialize(world, eid, updateMessage.data[cursor]);
        cursor += 1; // TODO we assume each serializer only writes 1 thing
      }
    }

    for (let j = 0; j < message.deletes.length; j += 1) {
      const nid = message.deletes[j];
      world.deletedNids.add(APP.getSid(nid));
    }
  }

  pendingMessages.length = 0;
  if (messagesToRevisit.updates.length) {
    pendingMessages.push(messagesToRevisit);
  }

  // TODO If there's a scene owned object, we should take ownership of it
}

const TICK_RATE = 3000;
let nextNetworkTick = 0;
export function networkSendSystem(world) {
  if (performance.now() < nextNetworkTick) return;

  nextNetworkTick = performance.now() + TICK_RATE;

  const message = {
    creates: [],
    updates: [],
    deletes: []
  };

  {
    const entities = enteredNetworkedObjectsQuery(world);
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      if (Networked.creator[eid] === APP.getSid(NAF.clientId)) {
        message.creates.push(APP.getString(Networked.id[eid]));
        message.creates.push(Networked.creator[eid]);
        message.creates.push(Networked.owner[eid]);
        message.creates.push(createMessageDatas.get(eid));
      }
    }
  }

  const entities = ownedNetworkObjectsQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    const updateMessage = {
      nid: APP.getString(Networked.id[eid]),
      lastOwnerTime: Networked.lastOwnerTime[eid],
      componentIds: [],
      data: []
    };

    for (let j = 0; j < networkableComponents.length; j++) {
      const Component = networkableComponents[j];
      if (hasComponent(world, Component, eid)) {
        updateMessage.componentIds.push(j);
        schemas.get(Component).serialize(world, eid, updateMessage.data);
      }
    }

    if (updateMessage.componentIds.length) {
      message.updates.push(updateMessage);
    }
  }

  if (message.creates.length || message.updates.length || message.deletes.length) {
    // TODO we use NAF as a "dumb" transport here. This should happen in a better way
    NAF.connection.broadcastDataGuaranteed("nn", message);
  }
}

// function onPeerJoined(world, peer) {
//   const entities = ownedNetworkObjectsQuery(world);
//   for (let i = 0; i < entities.length; i++) {
//     const eid = entities[i];
//     const templateId = Networked.templateId[eid];
//     if (templateId === TEMPLATE_ID_LEGACY_NAF) continue;
//
//     const schema = schemas[templateId];
//     updates.push(world.eid2nid.get(eid));
//     updates.push(Networked.lastOwnerTime[eid]);
//     schema.serialize(world, eid, updates, { full: true });
//   }
//
//   NAF.connection.sendDataGuaranteed(peer, message);
// }
//
