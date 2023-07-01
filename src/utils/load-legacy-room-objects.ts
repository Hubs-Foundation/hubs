import { pendingMessages } from "../bit-systems/networking";
import { messageForLegacyRoomObject } from "./message-for";
import { getReticulumFetchUrl } from "./phoenix-utils";
import { CreateEntityStatePayload, createEntityStateWithPayload } from "./entity-state-utils";

type LegacyRoomObject = any;

type StoredRoomData = {
  asset: {
    version: "2.0";
    generator: "reticulum";
  };
  scenes: [{ nodes: number[]; name: "Room Objects" }];
  nodes: LegacyRoomObject[];
  extensionsUsed: ["HUBS_components"];
};

// "Legacy Room Objects" are objects that were pinned to the room
// before the release of the Entity State apis.
//
// We do not run any migration on the backend to transform Legacy
// Room Objects into Entity States. This means we need to load
// and handle Legacy Room Objects in the client indefinitely.
//
// First, we download the Legacy Room Objects.
//
// Then, we synthesize `CreateMessage` and `UpdateMessages` for each.
// The only type of Legacy Room Objects that are saved in the database
// are "media" objects: images, videos, models, etc that were previously
// added to the room and then "pinned" by a user. Therefore, it is easy
// for us to synthesize `CreateMessage`s using the "media" prefab.
//
// We queue the synthesized messages so that the network-receive-system
// can handle them like any other normal messages.
//
// Finally, we need each Legacy Room Object to have an associated Entity State
// record in the database. If they don't, then clients will not be able
// to update it. (For example, a user will move a pinned entity, send a request
// to reticulum to update the Entity State, and reticulum will reject the
// update because there's no matching record.)
//
export async function loadLegacyRoomObjects(hubId: string) {
  const objectsUrl = getReticulumFetchUrl(`/${hubId}/objects.gltf`) as URL;
  const response = await fetch(objectsUrl);
  const roomData: StoredRoomData = await response.json();

  if (hubId === APP.hub!.hub_id) {
    const legacyRoomObjects: LegacyRoomObject[] = roomData.nodes;
    legacyRoomObjects.forEach(obj => {
      let message = messageForLegacyRoomObject(obj);
      let nid = obj.name;
      let payload: CreateEntityStatePayload = {
        nid,
        create_message: message.creates[0],
        updates: [
          {
            root_nid: nid,
            nid,
            update_message: message.updates[0]
          }
        ]
      };
      createEntityStateWithPayload(APP.hubChannel!, APP.world, payload);
      message.fromClientId = "reticulum";
      pendingMessages.push(message);
    });
  }
}
