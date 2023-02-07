import { pendingMessages } from "../bit-systems/networking";
import { messageForLegacyRoomObjects } from "./message-for";
import { StorableMessage } from "./networking-types";
import { getReticulumFetchUrl } from "./phoenix-utils";

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

export async function loadLegacyRoomObjects(hubId: string) {
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
  }
}
