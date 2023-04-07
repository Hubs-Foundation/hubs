import { INodeDefinition, makeInNOutFunctionDesc, ValueType } from "@oveddan-behave-graph/core";
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
    name: "hubs/player/equal",
    label: "=",
    category: "Player" as any,
    in: ["player", "player"],
    out: [{ result: "player" }],
    exec: (a: ClientID, b: ClientID) => {
      return { result: a === b };
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
  })
]);
