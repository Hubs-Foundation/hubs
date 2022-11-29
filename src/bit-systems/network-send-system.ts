import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { HubsWorld } from "../app";
import { Networked, Owned } from "../bit-components";
import { getServerTime } from "../phoenix-adapter";
import { messageFor } from "../utils/message-for";
import type { EntityID, Message } from "../utils/networking-types";
import {
  createMessageDatas,
  isCreatedByMe,
  isNetworkInstantiated,
  localClientID,
  networkedQuery,
  pendingJoins
} from "./networking";

const ticksPerSecond = 12;
const millisecondsBetweenTicks = 1000 / ticksPerSecond;
let nextTick = 0;

const ownedNetworkedQuery = defineQuery([Owned, Networked]);
const enteredNetworkedQuery = enterQuery(networkedQuery);
const enteredOwnedNetworkedQuery = enterQuery(ownedNetworkedQuery);
const exitedNetworkedQuery = exitQuery(networkedQuery);

export const pinMessages: Message[] = [];

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
    ownedNetworkedQuery(world).forEach(eid => {
      Networked.timestamp[eid] = timestamp;
    });
  }

  // Tell joining users about entities I network instantiated, and full updates for entities I own
  {
    if (pendingJoins.length) {
      const ownedNetworkedEntities = ownedNetworkedQuery(world);
      const message = messageFor(
        world,
        networkedQuery(world).filter(isCreatedByMe),
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

  // Tell everyone about entities I pin/unpin
  {
    for (let i = 0; i < pinMessages.length; i++) {
      const message = pinMessages[i];
      NAF.connection.broadcastDataGuaranteed("nn", message);
    }
    pinMessages.length = 0;
  }

  // Tell everyone about entities I created, entities I own, and entities that were deleted
  {
    // Note: Many people may send delete messages about the same entity
    const deletedEntities = exitedNetworkedQuery(world).filter(eid => {
      return !world.deletedNids.has(Networked.id[eid]) && isNetworkInstantiated(eid);
    });
    const message = messageFor(
      world,
      enteredNetworkedQuery(world).filter(isCreatedByMe),
      ownedNetworkedQuery(world),
      enteredOwnedNetworkedQuery(world),
      deletedEntities,
      true
    );
    if (message) NAF.connection.broadcastDataGuaranteed("nn", message);

    deletedEntities.forEach(eid => {
      createMessageDatas.delete(eid);
      world.deletedNids.add(Networked.id[eid]);
      world.nid2eid.delete(Networked.id[eid]);
    });
  }
}
