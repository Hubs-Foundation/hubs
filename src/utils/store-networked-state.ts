import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { localClientID } from "../bit-systems/networking";
import HubChannel from "./hub-channel";
import { messageFor, messageForStorage } from "./message-for";
import type { EntityID, Message } from "./networking-types";
import { takeOwnership } from "./take-ownership";

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
    nid,
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
