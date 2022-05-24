import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent } from "bitecs";
import { NetworkedMediaFrame, Networked, Owned } from "../bit-components";

const networkedObjectsQuery = defineQuery([Networked]);
const enteredNetworkedObjectsQuery = enterQuery(networkedObjectsQuery);
const ownedNetworkObjectsQuery = defineQuery([Networked, Owned]);

export const TEMPLATE_ID_LEGACY_NAF = 1;
export const TEMPLATE_ID_MEDIA_FRAME = 2;
const schemas = {
  [TEMPLATE_ID_MEDIA_FRAME]: {
    addEntity: function(componentProps) {
      return renderAsAframeEntity(<entity media-frame={componentProps} />, APP.world);
    },

    serialize(world, eid, updates) {
      // TODO: Just "serialize this component: NetworkedMediaFrame and determine changes"
      updates.push({
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
};

export function takeOwnership(world, eid) {
  // TODO handle case where lastOwner is already newer than now
  addComponent(world, Owned, eid);
  Networked.lastOwnerTime[eid] = NAF.connection.getServerTime();
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

      addComponent(world, Networked, eid);
      Networked.id[eid] = APP.getSid(nid);
      Networked.creator[eid] = APP.getSid(creator);
      Networked.owner[eid] = APP.getSid(owner);
    }

    for (let j = 0; j < message.updates.length; j += 3) {
      const nid = message.updates[j];
      const newLastOwnerTime = message.updates[j + 1];
      const update = message.updates[j + 2];

      if (!world.nid2eid.has(nid)) {
        console.log(`Holding onto an update for ${nid} because we don't have it yet.`);
        // TODO: What if we will NEVER be able to apply this update?
        messagesToRevisit.updates.push(nid);
        messagesToRevisit.updates.push(newLastOwnerTime);
        messagesToRevisit.updates.push(update);
        continue;
      }

      const eid = world.nid2eid.get(nid);

      if (Networked.lastOwnerTime[eid] > newLastOwnerTime) {
        console.log("Received update from an old owner, skipping", nid);
        continue;
      }

      // TODO handle tiebreak
      if (hasComponent(world, Owned, eid) && newLastOwnerTime > Networked.lastOwnerTime[eid]) {
        console.log("Lost ownership: ", nid);
        removeComponent(world, Owned, eid);
      }

      Networked.lastOwnerTime[eid] = newLastOwnerTime;

      const schema = schemas[Networked.templateId[eid]];
      schema.deserialize(world, eid, update);
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

const createMessageDatas = new Map();

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
    const templateId = Networked.templateId[eid];
    if (templateId === TEMPLATE_ID_LEGACY_NAF) continue;

    const schema = schemas[templateId];
    message.updates.push(APP.getString(Networked.id[eid]));
    message.updates.push(Networked.lastOwnerTime[eid]);
    schema.serialize(world, eid, message.updates);
  }

  if (message.creates.length || message.updates.length || message.deletes.length) {
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

import { CameraPrefab } from "../network-schemas/interactable-camera";
import { renderAsEntity } from "../utils/jsx-entity";

const prefabs = new Map([["camera", CameraPrefab]]);

export function createNetworkedEntity(world, prefabName, initialData) {
  const eid = renderAsEntity(world, prefabs.get(prefabName)(initialData));

  createMessageDatas.set(eid, { prefabName, initialData });

  addComponent(world, Networked, eid);
  Networked.id[eid] = APP.getSid(NAF.utils.createNetworkId());
  Networked.creator[eid] = APP.getSid(NAF.clientId);
  Networked.owner[eid] = APP.getSid(NAF.clientId);

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
