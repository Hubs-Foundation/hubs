import {
  INodeDefinition,
  makeFlowNodeDefinition,
  makeFunctionNodeDefinition,
  makeInNOutFunctionDesc,
  ValueType
} from "@oveddan-behave-graph/core";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { ClientID } from "../../utils/networking-types";
import { definitionListToMap } from "./utils";

export const playerValueDefs = {
  player: new ValueType(
    "player",
    () => null,
    (value: ClientID) => value,
    (value: ClientID) => value,
    (start: ClientID, _end: ClientID, _t: number) => start
  )
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
      return { displayName: presence.metas[0].profile.displayName };
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
  })
]);
