import { defineQuery, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { createMessageDatas, isNetworkInstantiated, isPinned, localClientID } from "../bit-systems/networking";
import { findAncestorEntity } from "./bit-utils";
import HubChannel from "./hub-channel";
import { queueEntityStateAsMessage } from "./listen-for-network-messages";
import { networkableComponents, schemas } from "./network-schemas";
import { CreateMessage, EntityID, NetworkID, StorableUpdateMessage } from "./networking-types";
import { deleteTheDeletableAncestor } from "../bit-systems/delete-entity-system";

export type EntityState = {
  create_message: CreateMessage;
  update_messages: StorableUpdateMessage[];
};

export type EntityStateList = {
  data: EntityState[];
};

export type UpdateEntityStatePayload = {
  root_nid: NetworkID;
  nid: NetworkID;
  update_message: StorableUpdateMessage;
};

export type CreateEntityStatePayload = {
  nid: NetworkID;
  create_message: CreateMessage;
  updates: UpdateEntityStatePayload[];
  file_id?: string;
  file_access_token?: string;
  promotion_token?: string;
};

export type DeleteEntityStatePayload = {
  nid: NetworkID;
  file_id?: string;
};

export function hasSavedEntityState(world: HubsWorld, eid: EntityID) {
  return !!findAncestorEntity(world, eid, ancestor => {
    return isNetworkInstantiated(ancestor) && isPinned(ancestor);
  });
}

export async function createEntityState(hubChannel: HubChannel, world: HubsWorld, eid: EntityID) {
  const payload = createEntityStatePayload(world, eid);
  return createEntityStateWithPayload(hubChannel, world, payload);
}

export async function createEntityStateWithPayload(
  hubChannel: HubChannel,
  world: HubsWorld,
  payload: CreateEntityStatePayload
) {
  // console.log("save_entity_state",  payload);
  return push(hubChannel, "save_entity_state", payload).catch(err => {
    console.warn("Failed to save entity state", err);
  });
}

export async function updateEntityState(hubChannel: HubChannel, world: HubsWorld, eid: EntityID) {
  const payload = updateEntityStatePayload(world, eid);
  // console.log("update_entity_state", payload);
  return push(hubChannel, "update_entity_state", payload);
}

export async function deleteEntityState(hubChannel: HubChannel, world: HubsWorld, eid: EntityID) {
  if (!isNetworkInstantiated(eid)) {
    throw new Error("Tried to delete entity state for non-network instantiated entity.");
  }
  if (!isPinned(eid)) {
    throw new Error("Tried to delete entity state for non-pinned entity.");
  }
  const payload: DeleteEntityStatePayload = {
    nid: APP.getString(Networked.id[eid])! as NetworkID
  };
  const {
    initialData: { fileId }
  } = createMessageDatas.get(eid)!;
  if (fileId) {
    payload.file_id = fileId;
  }
  // console.log("delete_entity_state",  payload);
  return push(hubChannel, "delete_entity_state", payload);
}

export async function loadSavedEntityStates(hubChannel: HubChannel) {
  const list = await listEntityStates(hubChannel);
  list.data.forEach(entityState => queueEntityStateAsMessage(entityState));
}

function entityStateCreateMessage(eid: EntityID): CreateMessage {
  const { prefabName, initialData } = createMessageDatas.get(eid)!;
  return {
    version: 1,
    networkId: APP.getString(Networked.id[eid])!,
    prefabName,
    initialData
  };
}

function entityStateUpdateMessage(world: HubsWorld, eid: EntityID): StorableUpdateMessage {
  const updateMessage: StorableUpdateMessage = {
    nid: APP.getString(Networked.id[eid])!,
    lastOwnerTime: Networked.lastOwnerTime[eid],
    timestamp: Networked.timestamp[eid],
    owner: APP.getString(Networked.owner[eid])!,
    data: {}
  };

  for (let j = 0; j < networkableComponents.length; j++) {
    const component = networkableComponents[j];
    if (hasComponent(world, component, eid)) {
      const schema = schemas.get(component)!;
      if (schema.serializeForStorage) updateMessage.data[schema.componentName] = schema.serializeForStorage(eid);
    }
  }

  return updateMessage;
}

type HubChannelCommand = "list_entities" | "save_entity_state" | "update_entity_state" | "delete_entity_state";
type HubChannelPayload = CreateEntityStatePayload | UpdateEntityStatePayload | DeleteEntityStatePayload;

function push(hubChannel: HubChannel, command: HubChannelCommand, payload?: HubChannelPayload) {
  if (!localClientID) {
    throw new Error("Cannot get/set entity states without a local client ID.");
  }
  return new Promise((resolve, reject) => {
    hubChannel.channel.push(command, payload).receive("ok", resolve).receive("error", reject);
  });
}

function listEntityStates(hubChannel: HubChannel) {
  return push(hubChannel, "list_entities") as Promise<EntityStateList>;
}

function updateEntityStatePayload(world: HubsWorld, eid: EntityID): UpdateEntityStatePayload {
  const nid = APP.getString(Networked.id[eid])!;
  return {
    root_nid: isNetworkInstantiated(eid) ? nid : APP.getString(Networked.creator[eid])!,
    nid,
    update_message: entityStateUpdateMessage(world, eid)
  };
}

function createEntityStatePayload(world: HubsWorld, rootEid: EntityID): CreateEntityStatePayload {
  const rootNid = APP.getString(Networked.id[rootEid])! as NetworkID;
  const create_message = entityStateCreateMessage(rootEid);
  const updates: UpdateEntityStatePayload[] = [];
  world.eid2obj.get(rootEid)!.traverse(o => {
    if (o.eid && hasComponent(world, Networked, o.eid)) {
      updates.push(updateEntityStatePayload(world, o.eid));
    }
  });

  const payload = {
    nid: rootNid,
    create_message,
    updates
  } as CreateEntityStatePayload;

  const {
    prefabName,
    initialData: { fileId, src }
  } = createMessageDatas.get(rootEid)!;

  if (prefabName == "media" && fileId && src) {
    const fileAccessToken = new URL(src).searchParams.get("token") as string;
    payload.file_id = fileId;
    payload.file_access_token = fileAccessToken;
  }
  return payload;
}

const networkedQuery = defineQuery([Networked]);
async function deleteAllEntityStates(hubChannel: HubChannel, world: HubsWorld) {
  console.warn("Deleting ALL saved entity states...");
  networkedQuery(world).forEach(eid => {
    if (isNetworkInstantiated(eid) && isPinned(eid)) {
      deleteEntityState(hubChannel, world, eid);
    }
  });
}

// For debugging
(window as any).deleteAllEntityStates = () => {
  deleteAllEntityStates(APP.hubChannel!, APP.world);
};

function downloadAsJson(exportObj: any, exportName: string) {
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
  var downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `${exportName}.json`);
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

async function downloadSavedEntityStates(hubChannel: HubChannel) {
  listEntityStates(hubChannel).then(list => {
    downloadAsJson(list, `hub-${hubChannel.hubId}`);
  });
}

// For debugging
(window as any).download = () => {
  downloadSavedEntityStates(APP.hubChannel!);
};

function rebroadcastEntityState(hubChannel: HubChannel, entityState: EntityState) {
  push(hubChannel, "save_entity_state", {
    nid: entityState.create_message.networkId,
    create_message: entityState.create_message,
    updates: entityState.update_messages.map(update => {
      return {
        root_nid: entityState.create_message.networkId,
        nid: update.nid,
        update_message: update
      };
    })
  });
}

function rewriteNidsForEntityState(entityState: EntityState) {
  const nid = NAF.utils.createNetworkId();
  entityState.create_message.networkId = nid;
  entityState.update_messages.forEach(updateMessage => {
    const parts = updateMessage.nid.split(".");
    parts.shift();
    parts.unshift(nid);
    updateMessage.nid = parts.join(".");
  });
}

function loadFromJson(hubChannel: HubChannel) {
  const fileSelector = document.createElement("input");
  fileSelector.setAttribute("type", "file");
  fileSelector.setAttribute("multiple", "");
  document.body.appendChild(fileSelector);
  fileSelector.click();

  fileSelector.addEventListener("change", (event: any) => {
    const fileList = event.target.files;
    const file = fileList[0]!;
    file.text().then((t: any) => {
      const entityStates: EntityStateList = JSON.parse(t);
      entityStates.data.forEach(entityState => {
        rewriteNidsForEntityState(entityState);
        rebroadcastEntityState(hubChannel, entityState);
      });
    });
    fileSelector.remove();
  });
}
(window as any).loadFromJson = () => {
  loadFromJson(APP.hubChannel!);
};

const TEST_ASSET_STATE =
  "https://raw.githubusercontent.com/Hubs-Foundation/hubs-sample-assets/main/Hubs%20Components/test_json/__NAME__";

export async function loadState(hubChannel: HubChannel, world: HubsWorld, state: string) {
  clearState(world, hubChannel);

  const stateUrl = TEST_ASSET_STATE.replace("__NAME__", state);
  console.log(stateUrl);
  const resp = await fetch(stateUrl);
  const entityStates: EntityStateList = await resp.json();
  entityStates.data.forEach(entityState => {
    rewriteNidsForEntityState(entityState);
    rebroadcastEntityState(hubChannel, entityState);
  });
}

export function clearState(world: HubsWorld, hubChannel: HubChannel) {
  networkedQuery(world).forEach(eid => {
    if (isNetworkInstantiated(eid) && isPinned(eid)) {
      deleteTheDeletableAncestor(world, eid);
    }
  });
}
