import { entityExists, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
// import { isCursorBufferUpdateMessage, storedUpdates } from "../bit-systems/network-receive-system";
import { isNetworkInstantiated, localClientID } from "../bit-systems/networking";
import { sleep } from "./async-utils";
import HubChannel from "./hub-channel";
import { messageForStorage } from "./message-for";
import type { DeleteEntityStatePayload, EntityID, NetworkID, SaveEntityStatePayload } from "./networking-types";
import { EntityStateList, StorableMessage } from "./networking-types";
import { takeOwnership } from "./take-ownership";

type HubChannelCommand =
  | "list_entity_states"
  | "save_entity_state"
  | "delete_entity_state"
  | "delete_entity_states_for_root_nid";
type HubChannelPayload = SaveEntityStatePayload | DeleteEntityStatePayload;

function push(hubChannel: HubChannel, command: HubChannelCommand, payload?: HubChannelPayload) {
  return new Promise((resolve, reject) => {
    hubChannel.channel.push(command, payload).receive("ok", resolve).receive("error", reject);
  });
}

function createSaveEntityStatePayload(world: HubsWorld, eid: EntityID, rootNid: NetworkID): SaveEntityStatePayload {
  const nid = APP.getString(Networked.id[eid])! as NetworkID;
  return {
    root_nid: rootNid,
    nid,
    message: messageForStorage(world, nid === rootNid ? [eid] : [], [eid], [])
  };
}

function createSaveEntityStatePayloadsForHierarchy(world: HubsWorld, rootEid: EntityID) {
  const payloads: SaveEntityStatePayload[] = [];
  const rootNid = APP.getString(Networked.id[rootEid])! as NetworkID;
  Networked.creator[rootEid] = APP.getSid("reticulum");
  world.eid2obj.get(rootEid)!.traverse(o => {
    if (o.eid && hasComponent(world, Networked, o.eid)) {
      // TODO We do not need to take ownership if this entity has no storable components
      takeOwnership(world, o.eid);
      payloads.push(createSaveEntityStatePayload(world, o.eid, rootNid));
    }
  });

  return payloads;
}

export async function saveEntityState(hubChannel: HubChannel, world: HubsWorld, eid: EntityID) {
  if (!localClientID) throw new Error("Tried to save entity state before connected to hub channel.");

  takeOwnership(world, eid);
  if (isNetworkInstantiated(eid)) {
    Networked.creator[eid] = APP.getSid("reticulum");
  }

  const payload = createSaveEntityStatePayload(world, eid, APP.getString(Networked.id[eid])!.split(".")[0]);
  console.log("Saving entity state:", payload);
  return push(hubChannel, "save_entity_state", payload);
}

export async function saveEntityStateHierarchy(hubChannel: HubChannel, world: HubsWorld, eid: EntityID) {
  if (!localClientID) throw new Error("Tried to save entity state hierarchy before connected to hub channel.");

  const payloads = createSaveEntityStatePayloadsForHierarchy(world, eid);
  console.log("Saving entity state hierachy:", payloads);
  return Promise.all(
    payloads.map(payload => {
      return push(hubChannel, "save_entity_state", payload);
    })
  );
}

export const pinCooldownMS = 500;

export async function deleteEntityStateHierarchy(hubChannel: HubChannel, world: HubsWorld, rootEid: EntityID) {
  if (!localClientID) throw new Error(`Tried to delete entity state hierarchy before connected to hub channel.`);

  Networked.creator[rootEid] = APP.getSid(localClientID!);
  takeOwnership(world, rootEid);

  const payload: DeleteEntityStatePayload = {
    nid: APP.getString(Networked.id[rootEid])! as NetworkID,
    message: messageForStorage(world, [rootEid], [rootEid], [])
  };
  console.log("Deleting entity state hierarchy:", payload);
  const firstPush = await push(hubChannel, "delete_entity_states_for_root_nid", payload);

  // HACK Reticulum doesn't protect against race conditions such as:
  // - Client A calls deleteEntityStateHierarchy
  // - Client B doesn't immediately received this message
  // - Client B moves the entity and calls saveEntityState (to update to stored position)
  // It may be necessary for reticulum to solve this problem.
  // In the meantime, we can get around the problem by re-sending the delete message a second time.
  // This will break rapid pinning / unpinning, so we also hide the pin button.
  await sleep(pinCooldownMS);
  if (entityExists(world, rootEid)) {
    Networked.creator[rootEid] = APP.getSid(localClientID!);
    takeOwnership(world, rootEid);
    return push(hubChannel, "delete_entity_states_for_root_nid", payload);
  }
  return firstPush;
}

export async function deleteEntityState(hubChannel: HubChannel, world: HubsWorld, eid: EntityID) {
  if (!localClientID) throw new Error(`Tried to delete entity state before connected to hub channel.`);

  takeOwnership(world, eid);
  if (isNetworkInstantiated(eid)) {
    Networked.creator[eid] = APP.getSid(localClientID);
  }

  const payload: DeleteEntityStatePayload = {
    nid: APP.getString(Networked.id[eid])! as NetworkID,
    message: messageForStorage(world, [eid], [eid], [])
  };

  console.log("Deleting entity state:", payload);
  return push(hubChannel, "delete_entity_state", payload);
}

export function listEntityStates(hubChannel: HubChannel) {
  return push(hubChannel, "list_entity_states") as Promise<EntityStateList>;
}

export function parseStorableMessages(list: EntityStateList): StorableMessage[] {
  return list.data.map(entityState => {
    entityState.message.fromClientId = "reticulum";
    entityState.message.updates.forEach(u => (u.owner = "reticulum"));
    return entityState.message;
  });
}
