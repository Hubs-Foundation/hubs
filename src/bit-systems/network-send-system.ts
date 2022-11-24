import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { HubsWorld } from "../app";
import { Networked, Owned } from "../bit-components";
import { getServerTime } from "../phoenix-adapter";
import { messageFor } from "../utils/message-for";
import type { EntityID } from "../utils/networking-types";
import { createMessageDatas, isNetworkInstantiated, localClientID, networkedQuery, pendingJoins } from "./networking";

function isNetworkInstantiatedByMe(eid: EntityID) {
  return isNetworkInstantiated(eid) && Networked.creator[eid] === APP.getSid(NAF.clientId);
}

const ticksPerSecond = 12;
const millisecondsBetweenTicks = 1000 / ticksPerSecond;
let nextTick = 0;

export const ownedNetworkedEntitiesQuery = defineQuery([Networked, Owned]);
const sendEnteredNetworkedEntitiesQuery = enterQuery(networkedQuery);
const sendEnteredOwnedEntitiesQuery = enterQuery(ownedNetworkedEntitiesQuery);
const sendExitedNetworkedEntitiesQuery = exitQuery(networkedQuery);

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
    ownedNetworkedEntitiesQuery(world).forEach(eid => {
      Networked.timestamp[eid] = timestamp;
    });
  }

  // Tell joining users about entities I network instantiated, and full updates for entities I own
  {
    if (pendingJoins.length) {
      const ownedNetworkedEntities = ownedNetworkedEntitiesQuery(world);
      const message = messageFor(
        world,
        networkedQuery(world).filter(isNetworkInstantiatedByMe),
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

  // Tell everyone about entities I created, entities I own, and entities that were deleted
  {
    // Note: Many people may send delete messages about the same entity
    const deleted = sendExitedNetworkedEntitiesQuery(world).filter(eid => {
      return !world.deletedNids.has(Networked.id[eid]) && isNetworkInstantiated(eid);
    });
    const message = messageFor(
      world,
      sendEnteredNetworkedEntitiesQuery(world).filter(isNetworkInstantiatedByMe),
      ownedNetworkedEntitiesQuery(world),
      sendEnteredOwnedEntitiesQuery(world),
      deleted,
      true
    );
    if (message) NAF.connection.broadcastDataGuaranteed("nn", message);

    deleted.forEach(eid => {
      createMessageDatas.delete(eid);
      world.deletedNids.add(Networked.id[eid]);
      world.nid2eid.delete(Networked.id[eid]);
    });
  }
}
