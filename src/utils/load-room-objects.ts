import { localClientID, pendingMessages } from "../bit-systems/networking";
import { messageForLegacyRoomObjects } from "./message-for";
import { getReticulumFetchUrl } from "./phoenix-utils";
import { StorableMessage } from "./store-networked-state";

type LegacyRoomObject = any;
type StoredRoomDataNode = LegacyRoomObject | StorableMessage;

type StoredRoomData = {
  asset: {
    version: "2.0";
    generator: "reticulum";
  };
  scenes: [{ nodes: number[]; name: "Room Objects" }];
  nodes: StoredRoomDataNode[];
  extensionsUsed: ["HUBS_components"];
};

export function isStorableMessage(node: any): node is StorableMessage {
  return !!(node.version && node.creates && node.updates && node.deletes);
}

async function fetchStoredRoomMessages(hubId: string) {
  const objectsUrl = getReticulumFetchUrl(`/${hubId}/objects.gltf`) as URL;
  const response = await fetch(objectsUrl);
  const roomData: StoredRoomData = await response.json();
  const messages: StorableMessage[] = roomData.nodes.filter(node => isStorableMessage(node));
  return messages;
}

export async function loadStoredRoomData(hubId: string) {
  const messages = await fetchStoredRoomMessages(hubId);
  if (hubId === APP.hub!.hub_id) {
    if (!localClientID) {
      throw new Error("Cannot apply stored messages without a local client ID");
    }
    messages.forEach(m => {
      m.fromClientId = "reticulum";
      m.updates.forEach(update => {
        update.owner = "reticulum";
      });
      pendingMessages.push(m);
    });
  }
}

export async function loadLegacyRoomObjects(hubId: string) {
  console.log("loading legacy room objects...");
  const objectsUrl = getReticulumFetchUrl(`/${hubId}/objects.gltf`) as URL;
  const response = await fetch(objectsUrl);
  const roomData: StoredRoomData = await response.json();
  const legacyRoomObjects: LegacyRoomObject[] = roomData.nodes.filter(node => !isStorableMessage(node));

  if (hubId === APP.hub!.hub_id) {
    const message = messageForLegacyRoomObjects(legacyRoomObjects);
    if (message) {
      message.fromClientId = "reticulum";

      pendingMessages.push(message);
      // TODO All clients must use the new loading path for this to work correctly,
      // because all clients must agree on which netcode to use (hubs networking
      // systems or networked aframe) for a given object.
    }
    console.log({ legacyRoomObjects, message });
  }
}
