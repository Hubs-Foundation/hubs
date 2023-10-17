import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { BehaviorGraph, EntityID, RemoteAvatar } from "../../../bit-components";
import { ClientID } from "../../../utils/networking-types";
import { HubsWorld } from "../../../app";
import { clientIdForEntity } from "../../behavior-graph";
import { playerEmitters } from "../player-nodes";

const entityIdToClientId = new Map<EntityID, ClientID>();

const behaviorGraphsQuery = defineQuery([BehaviorGraph]);
const behaviorGraphEnterQuery = enterQuery(behaviorGraphsQuery);
const playerQuery = defineQuery([RemoteAvatar]);
const playerJoinedQuery = enterQuery(playerQuery);
const playerLeftQuery = exitQuery(playerQuery);
export function playersSystem(world: HubsWorld) {
  behaviorGraphEnterQuery(world).forEach(eid => {
    const playerInfos = APP.componentRegistry["player-info"];
    playerInfos.forEach(playerInfo => {
      const clientId = clientIdForEntity(world, playerInfo.el.eid);
      entityIdToClientId.set(eid, clientId);
      playerEmitters.onPlayerJoined.emit(clientId);
    });
  });

  playerJoinedQuery(world).forEach(eid => {
    const clientId = clientIdForEntity(world, eid);
    entityIdToClientId.set(eid, clientId);
    playerEmitters.onPlayerJoined.emit(clientId);
  });

  playerLeftQuery(world).forEach(eid => {
    const clientId = entityIdToClientId.get(eid);
    if (clientId) {
      playerEmitters.onPlayerLeft.emit(clientId);
      entityIdToClientId.delete(eid);
    }
  });
}
