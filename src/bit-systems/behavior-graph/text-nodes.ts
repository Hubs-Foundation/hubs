import { makeFlowNodeDefinition } from "@oveddan-behave-graph/core";
import { definitionListToMap } from "./utils";
import { HubsWorld } from "../../app";
import { EntityID, NetworkedText, TextTag } from "../../bit-components";
import { findChildWithComponent } from "../../utils/bit-utils";
import { Color } from "three";

const tmpColor = new Color();
export const TextNodes = definitionListToMap([
  makeFlowNodeDefinition({
    typeName: "text/setTextProperties",
    category: "Text" as any,
    label: "Set Text",
    in: {
      entity: "entity",
      setText: "flow",
      text: "string",
      setFontSize: "flow",
      fontSize: "float",
      setFontColor: "flow",
      color: "color",
      setTextOpacity: "flow",
      fillOpacity: "float"
    },
    out: { flow: "flow" },
    initialState: undefined,
    triggered: ({ read, commit, triggeringSocketName, graph }) => {
      const world = graph.getDependency<HubsWorld>("world")!;
      const eid = read<EntityID>("entity");
      const textEid = findChildWithComponent(world, TextTag, eid);
      if (textEid) {
        if (triggeringSocketName === "setText") {
          NetworkedText.text[textEid] = APP.getSid(read("text"));
        } else if (triggeringSocketName === "setFontSize") {
          NetworkedText.fontSize[textEid] = read("fontSize");
        } else if (triggeringSocketName === "setFontColor") {
          tmpColor.set(read("color"));
          NetworkedText.color[textEid] = tmpColor.getHex();
        } else if (triggeringSocketName === "setTextOpacity") {
          NetworkedText.fillOpacity[textEid] = read("fillOpacity");
        }
      }
      commit("flow");
    }
  })
]);
