import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent } from "bitecs";
import { Networked, Owned, MediaFrame } from "../bit-components";

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
        capturedEntity: MediaFrame.capturedEntity[eid] ? world.eid2nid.get(MediaFrame.capturedEntity[eid]) : 0, // TODO: nid / eid / 0 conversion
        originalTargetScale: Array.from(MediaFrame.originalTargetScale[eid])
      });
    },

    deserialize(world, frameEid, update) {
      if (update.capturedEntity && !world.nid2eid.has(update.capturedEntity)) {
        console.error("I don't know about this entity...");
        // TODO: Hold onto this update and reconsider it later
        return;
      }

      const newCapturedEid = update.capturedEntity ? world.nid2eid.get(update.capturedEntity) : 0; // TODO: nid / eid / 0 conversion
      if (
        MediaFrame.capturedEntity[frameEid] &&
        MediaFrame.capturedEntity[frameEid] !== newCapturedEid &&
        hasComponent(world, Owned, MediaFrame.capturedEntity[frameEid])
      ) {
        // The captured entity changed... I need to pop the old one out
        setMatrixScale(
          world.eid2obj.get(MediaFrame.capturedEntity[frameEid]),
          MediaFrame.originalTargetScale[frameEid]
        );
        physicsSystem.updateBodyOptions(Rigidbody.bodyId[MediaFrame.capturedEntity[frameEid]], { type: "dynamic" });
      }

      MediaFrame.capturedEntity[frameEid] = newCapturedEid;
      MediaFrame.originalTargetScale[frameEid].set(update.originalTargetScale);
    }
  }
};

export function takeOwnership(world, eid) {
  // TODO handle case where lastOwner is already newer than now
  addComponent(world, Owned, eid);
  Networked.lastOwnerTime[eid] = NAF.connection.getServerTime();
}

const pendingMsgs = [];

NAF.connection.subscribeToDataChannel("nn", function(_, _dataType, data) {
  pendingMsgs.push(data);
});

export function applyNetworkUpdates(world) {
  const stillToProcess = {
    updates: []
  };

  for (let i = 0; i < pendingMsgs.length; i++) {
    const msg = pendingMsgs[i];
    for (let j = 0; j < msg.updates.length; j += 3) {
      const nid = msg.updates[j];
      const newLastOwnerTime = msg.updates[j + 1];
      const update = msg.updates[j + 2];

      if (!world.nid2eid.has(nid)) {
        console.log("got update for", nid, "but we dont have it yet, holding onto it");
        stillToProcess.updates.push(nid);
        stillToProcess.updates.push(newLastOwnerTime);
        stillToProcess.updates.push(update);
        continue;
      }

      const eid = world.nid2eid.get(nid);

      if (Networked.lastOwnerTime[eid] > newLastOwnerTime) {
        console.log("Got update from an old owner, skipping", nid);
        continue;
      }

      // TODO handle tiebreak
      if (hasComponent(world, Owned, eid) && newLastOwnerTime > Networked.lastOwnerTime[eid]) {
        console.log("Lost ownership", nid);
        removeComponent(world, Owned, eid);
      }

      Networked.lastOwnerTime[eid] = newLastOwnerTime;

      const schema = schemas[Networked.templateId[eid]];
      schema.deserialize(world, eid, update);
    }
  }
  pendingMsgs.length = 0;
  if (stillToProcess.updates.length) {
    pendingMsgs.push(stillToProcess);
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
      console.log("new networked object", eid, world.eid2nid.get(eid), Networked.templateId[eid]);
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
