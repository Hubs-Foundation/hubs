import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent } from "bitecs";
import { FrameUpdate, Networked, Owned, MediaFrame } from "../bit-components";

const networkedObjectsQuery = defineQuery([Networked]);
const ownedNetworkObjectsQuery = defineQuery([Networked, Owned]);
const enteredNetworkedObjectsQuery = enterQuery(networkedObjectsQuery);

const nid2eid = new Map();

export const TEMPLATE_ID_LEGACY_NAF = 1;
export const TEMPLATE_ID_MEDIA_FRAME = 2;
const schemas = {
  [TEMPLATE_ID_MEDIA_FRAME]: {
    addEntity: function(componentProps) {
      return renderAsAframeEntity(<entity media-frame={componentProps} />, APP.world);
    },

    serialize(world, eid, updates) {
      updates.push({
        isFull: MediaFrame.isFull[eid],
        captured: MediaFrame.captured[eid] ? world.eid2nid.get(MediaFrame.captured[eid]) : 0,
        scale: Array.from(MediaFrame.scale[eid])
      });
    },

    deserialize(world, frameEid, update) {
      addComponent(world, FrameUpdate, frameEid);
      FrameUpdate.isFull[frameEid] = update.isFull;
      // If we don't have an eid for this nid, set it to zero for now.
      FrameUpdate.captured[frameEid] = (update.captured && world.nid2eid.get(update.captured)) || 0;
      FrameUpdate.scale[frameEid].set(update.scale);

      // Re-enqueue this update if we did not have an eid for this nid.
      return update.captured && !world.nid2eid.has(update.captured);
      // TODO BUG: We should only re enqueue this update if we have not received
      //           a more recent update about this frame. Right now, we are re-enqueuing
      //           invalid updates until the owner time changes (or the update becomes valid).
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
    updates: []
  };
  for (let i = 0; i < pendingMessages.length; i++) {
    const message = pendingMessages[i];
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
      if (schema.deserialize(world, eid, update)) {
        // TODO: What if we will NEVER be able to apply this update?
        messagesToRevisit.updates.push(nid);
        messagesToRevisit.updates.push(newLastOwnerTime);
        messagesToRevisit.updates.push(update);
      }
    }
  }

  pendingMessages.length = 0;
  if (messagesToRevisit.updates.length) {
    pendingMessages.push(messagesToRevisit);
  }

  // TODO If there's a scene owned object, we should take ownership of it
}

const TICK_RATE = 1000;
let nextNetworkTick = 0;
export function networkSendSystem(world) {
  if (performance.now() < nextNetworkTick) return;

  nextNetworkTick = performance.now() + TICK_RATE;

  {
    const entities = enteredNetworkedObjectsQuery(world);
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      // its a create if there is no networkId
    }
  }

  const updates = [];
  const entities = ownedNetworkObjectsQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const templateId = Networked.templateId[eid];
    if (templateId === TEMPLATE_ID_LEGACY_NAF) continue;

    const schema = schemas[templateId];
    updates.push(world.eid2nid.get(eid));
    updates.push(Networked.lastOwnerTime[eid]);
    schema.serialize(world, eid, updates);
  }

  if (updates.length) {
    NAF.connection.broadcastDataGuaranteed("nn", {
      updates
    });
  }
}

export function createNetworkedEntity(world, templateId, eid = addEntity(world)) {
  world.networkSchemas[templateId].addEntity(world, eid);
  addComponent(world, Networked, eid);
  Networked.networkId[eid] = networkId++;
  Networked.templateId[eid] = templateId;
  return eid;
}

// NAF.connection.broadcastDataGuaranteed("nn", {
//   updates: [
//     "parent1.media-frame-46",
//     3322421220,
//     {
//       "isFull": 1,
//       "captured": "565e735",
//       "scale": [
//         1,
//         1,
//         1
//       ]
//     }
//   ]
// })
