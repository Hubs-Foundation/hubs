import { Networked } from "../bit-components";
import type { EntityID, Message } from "./networking-types";
import { HubsWorld } from "../app";
import HubChannel from "./hub-channel";
import { takeOwnership } from "./take-ownership";
import { messageFor, messageForStorage } from "./message-for";
import { setCreator } from "./set-creator";
import { localClientID } from "../bit-systems/networking";
import { pinMessages } from "../bit-systems/network-send-system";

export interface StorableMessage extends Message {
  version: 1;
}

export async function tryPin(world: HubsWorld, eid: EntityID, hubChannel: HubChannel) {
  takeOwnership(world, eid);
  setCreator(world, eid, "reticulum");

  const nid = APP.getString(Networked.id[eid])!;

  const storableMessage = messageForStorage(world, [eid], [eid], []);
  const fileId = null;
  const fileAccessToken = null;
  const promotionToken = null;
  console.log("Pinning:", { nid, storableMessage });
  await hubChannel.pin(nid, storableMessage, fileId, fileAccessToken, promotionToken);
}

export async function tryUnpin(world: HubsWorld, eid: EntityID, hubChannel: HubChannel) {
  if (!localClientID) throw new Error("Tried to unpin before connected to the channel...");
  takeOwnership(world, eid);
  setCreator(world, eid, localClientID!);
  const message = messageFor(world, [eid], [eid], [eid], [], false)!;
  pinMessages.push(message);
  const fileId = null;
  console.log("this is where i would unpin...");
  hubChannel.unpin(APP.getString(Networked.id[eid])!, fileId);
}
