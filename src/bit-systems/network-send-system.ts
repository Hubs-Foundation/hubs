import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { HubsWorld } from "../app";
import { Networked, Owned } from "../bit-components";
import { getServerTime } from "../phoenix-adapter";
import { messageFor } from "../utils/message-for";
import {
  createMessageDatas,
  isCreatedByMe,
  isNetworkInstantiated,
  localClientID,
  millisecondsBetweenTicks,
  networkedQuery,
  pendingJoins,
  softRemovedEntities
} from "./networking";

let nextTick = 0;

const ownedNetworkedQuery = defineQuery([Owned, Networked]);
const enteredNetworkedQuery = enterQuery(networkedQuery);
const enteredOwnedNetworkedQuery = enterQuery(ownedNetworkedQuery);
const exitedNetworkedQuery = exitQuery(networkedQuery);

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

  // Send newly joined clients creates for entities where I am the creator, and full updates for entities I own
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
      pendingJoins.forEach(clientId => {
        if (message) {
          NAF.connection.sendDataGuaranteed(APP.getString(clientId)!, "nn", message);
        }
      });
      pendingJoins.length = 0;
    }
  }

  // Tell everyone about entities I created, entities I own, and entities that I deleted
  {
    const removedEntities = exitedNetworkedQuery(world).filter(isNetworkInstantiated);
    const deletedEntities = removedEntities.filter(eid => {
      return (
        // Don't send delete messages for entities that were not explicitly deleted.
        !softRemovedEntities.has(eid) &&
        // Rebroadcast delete messages of entities I created, in case
        // a user who just joined missed a delete message I received.
        (!world.deletedNids.has(Networked.id[eid]) || isCreatedByMe(eid))
      );
    });

    const message = messageFor(
      world,
      enteredNetworkedQuery(world).filter(isCreatedByMe),
      ownedNetworkedQuery(world),
      enteredOwnedNetworkedQuery(world),
      deletedEntities,
      true
    );
    if (message) {
      NAF.connection.broadcastDataGuaranteed("nn", message);
    }

    deletedEntities.forEach(eid => {
      world.deletedNids.add(Networked.id[eid]);
    });

    removedEntities.forEach(eid => {
      createMessageDatas.delete(eid);
      world.nid2eid.delete(Networked.id[eid]);
    });

    softRemovedEntities.clear();
  }
}
