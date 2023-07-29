import {
  EventEmitter,
  makeEventNodeDefinition,
  makeFlowNodeDefinition,
  makeFunctionNodeDefinition,
  makeInNOutFunctionDesc,
  NodeCategory,
  ValueType
} from "@oveddan-behave-graph/core";
import { Euler, Matrix4, Object3D, Quaternion, Vector3 } from "three";
import { getPlayerInfo } from "../../utils/component-utils";
import { ClientID } from "../../utils/networking-types";
import { definitionListToMap } from "./utils";
import { AElement } from "aframe";
import { HubsWorld } from "../../app";
import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { BehaviorGraph, EntityID, RemoteAvatar } from "../../bit-components";
import { clientIdForEntity } from "../behavior-graph";

export const playerValueDefs = {
  player: new ValueType(
    "player",
    () => null,
    (value: ClientID) => value,
    (value: ClientID) => value,
    (start: ClientID, _end: ClientID, _t: number) => start
  )
};

type PlayerEventData = {
  callback?: (target: ClientID) => void;
};

export const playerEmitters = {
  onPlayerJoined: new EventEmitter<ClientID>(),
  onPlayerLeft: new EventEmitter<ClientID>()
};

export const playerNodedefs = definitionListToMap([
  makeInNOutFunctionDesc({
    name: "hubs/player/getLocalPlayer",
    label: "Get Local Player",
    category: "Player" as any,
    in: [],
    out: [{ player: "player" }],
    exec: () => {
      return { player: NAF.clientId };
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/player/isLocalPlayer",
    label: "Is Local Player?",
    category: "Player" as any,
    in: [{ player: "player" }],
    out: [{ result: "boolean" }],
    exec: (player: ClientID) => {
      return player === NAF.clientId;
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/player/isRoomOwner",
    label: "Is a room owner?",
    category: "Player" as any,
    in: [{ player: "player" }],
    out: [{ result: "boolean" }],
    exec: (player: ClientID) => {
      return APP.hubChannel!.isRoomOwner(player);
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/player/isRoomCreator",
    label: "Is the room creator?",
    category: "Player" as any,
    in: [{ player: "player" }],
    out: [{ result: "boolean" }],
    exec: (player: ClientID) => {
      return APP.hubChannel!.isRoomCreator(player);
    }
  }),
  makeFunctionNodeDefinition({
    typeName: "hubs/player/hasPermission",
    label: "Player Has Permission?",
    category: "Player" as any,
    in: () => [
      { key: "player", valueType: "player" },
      {
        key: "permission",
        valueType: "string",
        choices: [
          { text: "Amplify Audio", value: "amplify_audio" },
          { text: "Close Hub", value: "close_hub" },
          { text: "Embed Hub", value: "embed_hub" },
          { text: "Fly", value: "fly" },
          { text: "Join Hub", value: "join_hub" },
          { text: "Kick Users", value: "kick_users" },
          { text: "Mute Users", value: "mute_users" },
          { text: "Pin Objects", value: "pin_objects" },
          { text: "Spawn and move media", value: "spawn_and_move_media" },
          { text: "Spawn Camera", value: "spawn_camera" },
          { text: "Spawn Drawing", value: "spawn_drawing" },
          { text: "Spawn Emoji", value: "spawn_emoji" },
          { text: "Text Chat", value: "text_chat" },
          { text: "Update Hub", value: "update_hub" },
          { text: "Update Hub Promotion", value: "update_hub_promotion" },
          { text: "Update Roles", value: "update_roles" },
          { text: "Voice Chat", value: "voice_chat" }
        ],
        defaultValue: "spawn_and_move_media"
      }
    ],
    out: {
      result: "boolean"
    },
    exec: ({ read, write }) => {
      const player = read<ClientID>("player");
      const permission = read<string>("permission");
      write("result", APP.hubChannel!.userCan(player, permission));
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/player/equal",
    label: "=",
    category: "Player" as any,
    in: ["player", "player"],
    out: [{ result: "boolean" }],
    exec: (a: ClientID, b: ClientID) => {
      return a === b;
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/player/getDisplayname",
    label: "Get Display Name",
    category: "Player" as any,
    in: [{ player: "player" }],
    out: [{ displayName: "string" }],
    exec: (player: ClientID) => {
      const presence = APP.hubChannel!.presence.state[player];
      return { displayName: presence?.metas[0].profile.displayName || "" };
    }
  }),
  makeFlowNodeDefinition({
    typeName: "hubs/player/teleport",
    category: "Player" as any,
    label: "Teleport",
    in: {
      flow: "flow",
      player: "player",
      position: "vec3",
      rotation: "euler",
      snapToNavMesh: "boolean",
      instant: "boolean",
      maintainInitialOrientation: "boolean"
    },
    out: { flow: "flow" },
    initialState: undefined,
    triggered: ({ read, commit }) => {
      const player = read<ClientID>("player");
      if (player === NAF.clientId) {
        const position = read<Vector3>("position");
        const rotation = read<Euler>("rotation");
        const snapToNavMesh = read<boolean>("snapToNavMesh");
        const instant = read<boolean>("instant");
        const maintainInitialOrientation = read<boolean>("maintainInitialOrientation");
        console.log("teleporting player to", position, rotation);
        const characterController = AFRAME.scenes[0].systems["hubs-systems"].characterController;
        characterController.enqueueWaypointTravelTo(
          new Matrix4().compose(position, new Quaternion().setFromEuler(rotation), new Vector3(1, 1, 1)),
          instant,
          { snapToNavMesh, willMaintainInitialOrientation: maintainInitialOrientation }
        );
      } else {
        console.warn("tried to teleport a remote player");
      }
      commit("flow");
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/player/getTransform",
    label: "Get Transform",
    category: "Player" as any,
    in: [{ player: "player" }],
    out: [{ position: "vec3" }, { rotation: "euler" }, { scale: "vec3" }],
    exec: (player: ClientID) => {
      const info = getPlayerInfo(player)!;
      const obj = info.el.object3D as Object3D;
      return {
        // TODO this is largely so that variables work since they are set using =. We can add support for .copy()-able things
        position: obj.position.clone(),
        rotation: obj.rotation.clone(),
        scale: obj.scale.clone()
      };
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/player/getHeadTransform",
    label: "Get Head Transform",
    category: "Player" as any,
    in: [{ player: "player" }],
    out: [{ position: "vec3" }, { rotation: "euler" }, { scale: "vec3" }],
    exec: (player: ClientID) => {
      const info = getPlayerInfo(player)!;
      const camera = info.el.querySelector(".camera")! as AElement;
      const obj = camera.object3D as Object3D;
      return {
        // TODO this is largely so that variables work since they are set using =. We can add support for .copy()-able things
        position: obj.position.clone(),
        rotation: obj.rotation.clone(),
        scale: obj.scale.clone()
      };
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/player/getWorldHeadTransform",
    label: "Get World Head Transform",
    category: "Player" as any,
    in: [{ player: "player" }],
    out: [{ position: "vec3" }, { rotation: "euler" }, { scale: "vec3" }],
    exec: (player: ClientID) => {
      const info = getPlayerInfo(player)!;
      const camera = info.el.querySelector(".camera")! as AElement;
      const obj = camera.object3D as Object3D;
      obj.updateMatrices();
      const position = new Vector3();
      const rotation = new Quaternion();
      const scale = new Vector3();
      obj.matrixWorld.decompose(position, rotation, scale);
      return {
        position,
        rotation: new Euler().setFromQuaternion(rotation),
        scale
      };
    }
  }),
  makeEventNodeDefinition({
    typeName: `hubs/onPlayerJoined`,
    category: "Event" as NodeCategory,
    label: "On Player Joined",
    in: {},
    out: {
      flow: "flow",
      player: "player"
    },
    initialState: {} as PlayerEventData,
    init: ({ write, commit }) => {
      const callback = (clientId: any) => {
        write("player", clientId);
        commit("flow");
      };

      playerEmitters.onPlayerJoined.addListener(callback);

      return { callback };
    },
    dispose: ({ state: { callback } }) => {
      playerEmitters.onPlayerJoined.removeListener(callback as any);
      return {};
    }
  }),
  makeEventNodeDefinition({
    typeName: `hubs/onPlayerLeft`,
    category: "Event" as NodeCategory,
    label: "On Player Left",
    in: {},
    out: {
      flow: "flow",
      player: "player"
    },
    initialState: {} as PlayerEventData,
    init: ({ write, commit }) => {
      const callback = (clientId: any) => {
        write("player", clientId);
        commit("flow");
      };

      playerEmitters.onPlayerLeft.addListener(callback);

      return { callback };
    },
    dispose: ({ state: { callback } }) => {
      playerEmitters.onPlayerLeft.removeListener(callback as any);
      return {};
    }
  })
]);

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
