import {
  addComponent,
  Component,
  defineQuery,
  enterQuery,
  exitQuery,
  hasComponent,
  removeComponent,
  removeEntity
} from "bitecs";
import { HubsWorld } from "../app";
import { Networked, NetworkedMediaFrame, NetworkedTransform, NetworkedVideo, Owned } from "../bit-components";
import { getServerTime } from "../phoenix-adapter";
import { defineNetworkSchema } from "../utils/bit-utils";
import { renderAsEntity } from "../utils/jsx-entity";
import { takeOwnershipWithTime } from "../utils/take-ownership-with-time";
import { takeOwnership } from "../utils/take-ownership";
import { PrefabName, prefabs } from "../prefabs/prefabs";

export type EntityID = number;

let localClientID: ClientID | null = null;
export function setLocalClientID(clientID: ClientID) {
  localClientID = clientID;
}

interface CreateMessageData {
  prefabName: PrefabName;
  initialData: InitialData;
}
const createMessageDatas: Map<EntityID, CreateMessageData> = new Map();

type InitialData = any;

export function createNetworkedEntityFromRemote(
  world: HubsWorld,
  prefabName: PrefabName,
  initialData: InitialData,
  rootNid: string,
  creator: ClientID,
  owner: ClientID
) {
  const eid = renderAsEntity(world, prefabs.get(prefabName)!.template(initialData));
  const obj = world.eid2obj.get(eid)!;

  createMessageDatas.set(eid, { prefabName, initialData });

  let i = 0;
  obj.traverse(function (o) {
    if (o.eid && hasComponent(world, Networked, o.eid)) {
      const eid = o.eid;
      Networked.id[eid] = APP.getSid(i === 0 ? rootNid : `${rootNid}.${i}`);
      APP.world.nid2eid.set(Networked.id[eid], eid);
      Networked.creator[eid] = APP.getSid(creator);
      Networked.owner[eid] = APP.getSid(owner);
      if (NAF.clientId === owner) takeOwnership(world, eid);
      i += 1;
    }
  });

  AFRAME.scenes[0].object3D.add(obj);
  return eid;
}

function spawnAllowed(creator: ClientID, prefabName: PrefabName) {
  const perm = prefabs.get(prefabName)!.permission;
  return !perm || APP.hubChannel!.userCan(creator, perm);
}

export function createNetworkedEntity(world: HubsWorld, prefabName: PrefabName, initialData: InitialData) {
  if (!spawnAllowed(NAF.clientId, prefabName)) throw new Error(`You do not have permission to spawn ${prefabName}`);
  const rootNid = NAF.utils.createNetworkId();
  return createNetworkedEntityFromRemote(world, prefabName, initialData, rootNid, NAF.clientId, NAF.clientId);
}

const networkedEntitiesQuery = defineQuery([Networked]);
const ownedNetworkedEntitiesQuery = defineQuery([Networked, Owned]);

interface NetworkSchema {
  serialize: (
    world: HubsWorld,
    eid: EntityID,
    data: CursorBuffer,
    isFullSync: boolean,
    writeToShadow: boolean
  ) => boolean;
  deserialize: (world: HubsWorld, eid: EntityID, data: CursorBuffer) => void;
}

const schemas: Map<Component, NetworkSchema> = new Map();
schemas.set(NetworkedMediaFrame, defineNetworkSchema(NetworkedMediaFrame));
schemas.set(NetworkedTransform, defineNetworkSchema(NetworkedTransform));
schemas.set(NetworkedVideo, defineNetworkSchema(NetworkedVideo));
const networkableComponents = Array.from(schemas.keys());

type ClientID = string;
type NetworkID = string;
type CreateMessage = [networkId: NetworkID, prefabName: PrefabName, initialData: InitialData];
type UpdateMessage = {
  nid: NetworkID;
  lastOwnerTime: number;
  timestamp: number;
  owner: ClientID;
  creator: ClientID;
  componentIds: number[];
  data: CursorBuffer;
};
type CursorBuffer = { cursor?: number; push: (data: any) => {} };
type DeleteMessage = NetworkID;
interface Message {
  fromClientId?: ClientID;
  creates: CreateMessage[];
  updates: UpdateMessage[];
  deletes: DeleteMessage[];
}

const pendingMessages: Message[] = [];
type StringID = number;
const pendingJoins: StringID[] = [];
const pendingParts: StringID[] = [];
const partedClientIds = new Set<StringID>();

type Emitter = {
  on: (event: string, callback: (a: any) => any) => number;
  off: (event: string, ref: number) => void;
  trigger: (event: string, payload: any) => void;
  getBindings: () => any[];
};

type PhoenixChannel = any;
export function listenForNetworkMessages(channel: PhoenixChannel, presenceEventEmitter: Emitter) {
  presenceEventEmitter.on("hub:join", ({ key: nid }) => {
    // TODO: Is it OK to use join events for our own client id?
    pendingJoins.push(APP.getSid(nid));
  });
  presenceEventEmitter.on("hub:leave", ({ key: nid }) => {
    pendingParts.push(APP.getSid(nid));
  });
  channel.on("naf", onNaf);
  channel.on("nafr", onNafr);
}
type NafMessage = {
  from_session_id: string;
  data: any;
  dataType: string;
  source: string;
};
function onNaf({ from_session_id, data, dataType }: NafMessage) {
  if (dataType == "nn") {
    (data as Message).fromClientId = from_session_id;
    pendingMessages.push(data);
  }
}
type NafrMessage = {
  from_session_id: string;
  naf: string;
  parsed?: NafMessage;
};
function onNafr(message: NafrMessage) {
  const { from_session_id, naf: unparsedData } = message;
  // Attach the parsed JSON to the message so that
  // PhoenixAdapter can process it without parsing it again.
  message.parsed = JSON.parse(unparsedData);
  message.parsed!.from_session_id = from_session_id;
  onNaf(message.parsed!);
}

function messageFor(
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
    const updateMessage: UpdateMessage = {
      nid: APP.getString(Networked.id[eid])!,
      lastOwnerTime: Networked.lastOwnerTime[eid],
      timestamp: Networked.timestamp[eid],
      owner: APP.getString(Networked.owner[eid])!, // This should always be NAF.clientId. If it's not, something bad happened
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

function isNetworkInstantiated(eid: EntityID) {
  return createMessageDatas.has(eid);
}

function isNetworkInstantiatedByMe(eid: EntityID) {
  return isNetworkInstantiated(eid) && Networked.creator[eid] === APP.getSid(NAF.clientId);
}

const pendingUpdatesForNid = new Map<StringID, UpdateMessage[]>();

const rcvEnteredNetworkedEntitiesQuery = enterQuery(defineQuery([Networked]));
export function networkReceiveSystem(world: HubsWorld) {
  if (!localClientID) return; // Not connected yet.

  {
    // When a user leaves, remove the entities created by that user
    const networkedEntities = networkedEntitiesQuery(world);
    pendingParts.forEach(partingClientId => {
      partedClientIds.add(partingClientId);

      networkedEntities
        .filter(eid => isNetworkInstantiated(eid) && Networked.creator[eid] === partingClientId)
        .forEach(eid => removeEntity(world, eid));
    });
  }

  // If we were hanging onto updates for any newly created non network instantiated entities
  // we can now apply them. Network instantiated entities are handled when processing creates.
  rcvEnteredNetworkedEntitiesQuery(world).forEach(eid => {
    const nid = Networked.id[eid];
    if (pendingUpdatesForNid.has(nid)) {
      console.log("Had pending updates for", APP.getString(nid), pendingUpdatesForNid.get(nid));
      const updates = pendingUpdatesForNid.get(nid)!;

      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        if (partedClientIds.has(APP.getSid(update.owner))) {
          console.log("Rewriting update message from client who left.", JSON.stringify(update));
          update.owner = NAF.clientId;
          update.lastOwnerTime = update.timestamp;
        }
      }

      pendingMessages.unshift({ creates: [], updates, deletes: [] });
      pendingUpdatesForNid.delete(nid);
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
      } else if (!spawnAllowed(creator, prefabName)) {
        // this should only ever happen if there is a bug or the sender is maliciously modified
        console.log(`Received create from a user who does not have permission to spawn ${prefabName}`);
        world.ignoredNids.add(nid); // TODO should we just use deletedNids for this?
      } else {
        const eid = createNetworkedEntityFromRemote(world, prefabName, initialData, nidString, creator, creator);
        console.log("got create message for", nidString, eid);

        // If we were hanging onto updates for this nid we can now apply them. And they should be processed before other updates.
        if (pendingUpdatesForNid.has(nid)) {
          console.log("had pending updates for", nidString, pendingUpdatesForNid.get(nid));
          Array.prototype.unshift.apply(message.updates, pendingUpdatesForNid.get(nid));
          pendingUpdatesForNid.delete(nid);
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
        const updates = pendingUpdatesForNid.get(nid) || [];
        updates.push(updateMessage);
        pendingUpdatesForNid.set(nid, updates);
        console.log(pendingUpdatesForNid);
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

      console.log("OK, deleting ", APP.getString(nid));
    }
  }
  pendingMessages.length = 0;

  {
    const networkedEntities = networkedEntitiesQuery(world);
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

const ticksPerSecond = 12;
const millisecondsBetweenTicks = 1000 / ticksPerSecond;
let nextTick = 0;

const sendEnteredNetworkedEntitiesQuery = enterQuery(networkedEntitiesQuery);
const sendEnteredOwnedEntitiesQuery = enterQuery(ownedNetworkedEntitiesQuery);
const sendExitedNetworkedEntitiesQuery = exitQuery(networkedEntitiesQuery);

export function networkSendSystem(world: HubsWorld) {
  if (!localClientID) return; // Not connected yet

  const now = performance.now();
  if (now < nextTick) return;

  if (now < nextTick + millisecondsBetweenTicks) {
    nextTick = nextTick + millisecondsBetweenTicks; // The usual case
  } else {
    // An unusually long delay happened
    nextTick = now + millisecondsBetweenTicks;
  }

  {
    // TODO: Ensure getServerTime() is monotonically increasing.
    // TODO: Get the server time from the websocket connection
    //       before we start sending any messages, in case of large local clock skew.
    const timestamp = getServerTime();
    ownedNetworkedEntitiesQuery(world).forEach(eid => {
      Networked.timestamp[eid] = timestamp;
    });
  }

  // Tell joining users about entities I network instantiated, and full updates for entities I own
  {
    if (pendingJoins.length) {
      const ownedNetworkedEntities = ownedNetworkedEntitiesQuery(world);
      const message = messageFor(
        world,
        networkedEntitiesQuery(world).filter(isNetworkInstantiatedByMe),
        ownedNetworkedEntities,
        ownedNetworkedEntities,
        [],
        false
      );
      if (message) {
        pendingJoins.forEach(clientId => NAF.connection.sendDataGuaranteed(APP.getString(clientId)!, "nn", message));
      }
      pendingJoins.length = 0;
    }
  }

  // Tell everyone about entities I created, entities I own, and entities that were deleted
  {
    // Note: Many people may send delete messages about the same entity
    const deleted = sendExitedNetworkedEntitiesQuery(world).filter(eid => {
      return !world.deletedNids.has(Networked.id[eid]) && isNetworkInstantiated(eid);
    });
    const message = messageFor(
      world,
      sendEnteredNetworkedEntitiesQuery(world).filter(isNetworkInstantiatedByMe),
      ownedNetworkedEntitiesQuery(world),
      sendEnteredOwnedEntitiesQuery(world),
      deleted,
      true
    );
    if (message) NAF.connection.broadcastDataGuaranteed("nn", message);

    deleted.forEach(eid => {
      createMessageDatas.delete(eid);
      world.deletedNids.add(Networked.id[eid]);
      world.nid2eid.delete(Networked.id[eid]);
    });
  }
}

// TODO: Handle reconnect
// TODO: Handle blocking/unblocking. Does this already work?
