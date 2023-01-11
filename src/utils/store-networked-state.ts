import { Networked } from "../bit-components";
import type { EntityID, Message } from "./networking-types";
import { HubsWorld } from "../app";
import HubChannel from "./hub-channel";
import { takeOwnership } from "./take-ownership";
import { messageFor, messageForStorage } from "./message-for";
import { localClientID } from "../bit-systems/networking";
import { unpinMessages } from "../bit-systems/network-send-system";

export interface StorableMessage extends Message {
  version: 1;
}

export async function tryPin(world: HubsWorld, eid: EntityID, hubChannel: HubChannel) {
  if (!localClientID) throw new Error("Tried to unpin before connected to the channel...");
  takeOwnership(world, eid);
  Networked.creator[eid] = APP.getSid("reticulum");

  const nid = APP.getString(Networked.id[eid])!;

  const storableMessage = messageForStorage(world, [eid], [eid], []);
  const fileId = null;
  const fileAccessToken = null;
  const promotionToken = null;
  console.log("Pinning is disabled until storage for new networked objects is implemented in reticulum.", {
    storableMessage,
    fileId,
    fileAccessToken,
    promotionToken
  });
}

export async function tryUnpin(world: HubsWorld, eid: EntityID, hubChannel: HubChannel) {
  if (!localClientID) throw new Error("Tried to unpin before connected to the channel...");
  takeOwnership(world, eid);
  Networked.creator[eid] = APP.getSid(localClientID!);
  const message = messageFor(world, [eid], [eid], [eid], [], false)!;
  const fileId = null;
  // unpinMessages.push(message);
  console.log("Pinning/unpinning is disabled until storage for new networked objects is implemented in reticulum.", {
    message,
    fileId
  });
}
