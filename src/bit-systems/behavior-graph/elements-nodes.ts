import { makeFlowNodeDefinition } from "@oveddan-behave-graph/core";
import { definitionListToMap } from "./utils";
import { EntityID, MediaFrame, NetworkedMediaFrame, NetworkedText, Owned, TextTag } from "../../bit-components";
import { HubsWorld } from "../../app";
import { findChildWithComponent } from "../../utils/bit-utils";
import { MEDIA_FRAME_FLAGS } from "../../inflators/media-frame";
import { Color } from "three";
import { takeOwnership } from "../../utils/take-ownership";

const tmpColor = new Color();
export const ElementNodes = definitionListToMap([
  makeFlowNodeDefinition({
    typeName: "text/setTextProperties",
    category: "Text" as any,
    label: "Set Text Property",
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
  }),
  makeFlowNodeDefinition({
    typeName: "media_frame/setMediaFrameProperty",
    category: "Media Frame" as any,
    label: "Set Media Frame Property",
    in: () => [
      { key: "entity", valueType: "entity" },
      { key: "setActive", valueType: "flow" },
      { key: "active", valueType: "boolean" },
      { key: "setLocked", valueType: "flow" },
      { key: "locked", valueType: "boolean" },
      { key: "setSnapToCenter", valueType: "flow" },
      { key: "snapToCenter", valueType: "boolean" }
    ],
    configuration: {
      networked: { valueType: "boolean" }
    },
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit, triggeringSocketName, graph, configuration }) => {
      const entity = read("entity") as EntityID;
      const world = graph.getDependency("world") as HubsWorld;

      const cmp = findChildWithComponent(world, MediaFrame, entity);
      if (cmp) {
        if (configuration.networked) {
          takeOwnership(world, cmp);
        }
        if (triggeringSocketName === "setActive") {
          const active = read("active");
          if (active) {
            MediaFrame.flags[cmp] |= MEDIA_FRAME_FLAGS.ACTIVE;
            if (configuration.networked) {
              NetworkedMediaFrame.flags[cmp] |= MEDIA_FRAME_FLAGS.ACTIVE;
            }
          } else {
            MediaFrame.flags[cmp] &= ~MEDIA_FRAME_FLAGS.ACTIVE;
            if (configuration.networked) {
              NetworkedMediaFrame.flags[cmp] &= ~MEDIA_FRAME_FLAGS.ACTIVE;
            }
          }
        } else if (triggeringSocketName === "setLocked") {
          const locked = read("locked");
          if (locked) {
            MediaFrame.flags[cmp] |= MEDIA_FRAME_FLAGS.LOCKED;
            if (configuration.networked) {
              NetworkedMediaFrame.flags[cmp] |= MEDIA_FRAME_FLAGS.LOCKED;
            }
          } else {
            MediaFrame.flags[cmp] &= ~MEDIA_FRAME_FLAGS.LOCKED;
            if (configuration.networked) {
              NetworkedMediaFrame.flags[cmp] &= ~MEDIA_FRAME_FLAGS.LOCKED;
            }
          }
        } else if (triggeringSocketName === "setSnapToCenter") {
          const snapToCenter = read("snapToCenter");
          if (snapToCenter) {
            MediaFrame.flags[cmp] |= MEDIA_FRAME_FLAGS.SNAP_TO_CENTER;
            if (configuration.networked) {
              NetworkedMediaFrame.flags[cmp] |= MEDIA_FRAME_FLAGS.SNAP_TO_CENTER;
            }
          } else {
            MediaFrame.flags[cmp] &= ~MEDIA_FRAME_FLAGS.SNAP_TO_CENTER;
            if (configuration.networked) {
              NetworkedMediaFrame.flags[cmp] &= ~MEDIA_FRAME_FLAGS.SNAP_TO_CENTER;
            }
          }
        }
      }
      commit("flow");
    }
  })
]);
