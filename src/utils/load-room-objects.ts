import { pendingMessages } from "../bit-systems/networking";
import { getReticulumFetchUrl } from "./phoenix-utils";
import { StorableMessage } from "./store-networked-state";

type HubsGltf = any;
type StoredRoomDataNode = HubsGltf | StorableMessage;

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
    messages.forEach(m => {
      m.fromClientId = "reticulum";
      m.hubId = hubId;
      console.log("queuing stored room data message", m);
      pendingMessages.push(m);
    });
  }
}
