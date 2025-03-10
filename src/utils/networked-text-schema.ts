import { NetworkedText } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const migrations = new Map<number, Migration>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const {
    text,
    fontSize,
    color,
    fillOpacity,
    anchorX,
    anchorY,
    curveRadius,
    direction,
    letterSpacing,
    lineHeight,
    maxWidth,
    opacity,
    outlineBlur,
    outlineColor,
    outlineOffsetX,
    outlineOffsetY,
    outlineOpacity,
    outlineWidth,
    overflowWrap,
    side,
    strokeColor,
    strokeOpacity,
    strokeWidth,
    textAlign,
    textIndent,
    whiteSpace
  }: {
    text: string;
    fontSize: number;
    color: number;
    fillOpacity: string;
    anchorX: number;
    anchorY: number;
    curveRadius: number;
    direction: number;
    letterSpacing: number;
    lineHeight: string;
    maxWidth: number;
    opacity: number;
    outlineBlur: string;
    outlineColor: number;
    outlineOffsetX: string;
    outlineOffsetY: string;
    outlineOpacity: number;
    outlineWidth: string;
    overflowWrap: number;
    side: number;
    strokeColor: number;
    strokeOpacity: number;
    strokeWidth: string;
    textAlign: number;
    textIndent: number;
    whiteSpace: number;
  } = data;
  write(NetworkedText.text, eid, APP.getSid(text));
  write(NetworkedText.fontSize, eid, fontSize);
  write(NetworkedText.color, eid, color);
  write(NetworkedText.fillOpacity, eid, APP.getSid(fillOpacity));
  write(NetworkedText.anchorX, eid, anchorX);
  write(NetworkedText.anchorY, eid, anchorY);
  write(NetworkedText.curveRadius, eid, curveRadius);
  write(NetworkedText.direction, eid, direction);
  write(NetworkedText.letterSpacing, eid, letterSpacing);
  write(NetworkedText.lineHeight, eid, APP.getSid(lineHeight));
  write(NetworkedText.maxWidth, eid, maxWidth);
  write(NetworkedText.opacity, eid, opacity);
  write(NetworkedText.outlineBlur, eid, APP.getSid(outlineBlur));
  write(NetworkedText.outlineColor, eid, outlineColor);
  write(NetworkedText.outlineOffsetX, eid, APP.getSid(outlineOffsetX));
  write(NetworkedText.outlineOffsetY, eid, APP.getSid(outlineOffsetY));
  write(NetworkedText.outlineOpacity, eid, outlineOpacity);
  write(NetworkedText.outlineWidth, eid, outlineWidth);
  write(NetworkedText.overflowWrap, eid, overflowWrap);
  write(NetworkedText.side, eid, side);
  write(NetworkedText.strokeColor, eid, strokeColor);
  write(NetworkedText.strokeOpacity, eid, strokeOpacity);
  write(NetworkedText.strokeWidth, eid, APP.getSid(strokeWidth));
  write(NetworkedText.textAlign, eid, textAlign);
  write(NetworkedText.textIndent, eid, textIndent);
  write(NetworkedText.text, eid, text);
  write(NetworkedText.whiteSpace, eid, whiteSpace);
  return true;
}

const runtimeSerde = defineNetworkSchema(NetworkedText);
export const NetworkedTextSchema: NetworkSchema = {
  componentName: "networked-text",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        text: APP.getString(read(NetworkedText.text, eid)),
        fontSize: read(NetworkedText.fontSize, eid),
        color: read(NetworkedText.color, eid),
        fillOpacity: APP.getString(read(NetworkedText.fillOpacity, eid)),
        anchorX: read(NetworkedText.anchorX, eid),
        anchorY: read(NetworkedText.anchorY, eid),
        curveRadius: read(NetworkedText.curveRadius, eid),
        direction: read(NetworkedText.direction, eid),
        letterSpacing: read(NetworkedText.letterSpacing, eid),
        lineHeight: APP.getString(read(NetworkedText.lineHeight, eid)),
        maxWidth: read(NetworkedText.maxWidth, eid),
        opacity: read(NetworkedText.opacity, eid),
        outlineBlur: APP.getString(read(NetworkedText.outlineBlur, eid)),
        outlineColor: read(NetworkedText.outlineColor, eid),
        outlineOffsetX: APP.getString(read(NetworkedText.outlineOffsetX, eid)),
        outlineOffsetY: APP.getString(read(NetworkedText.outlineOffsetY, eid)),
        outlineOpacity: read(NetworkedText.outlineOpacity, eid),
        outlineWidth: APP.getString(read(NetworkedText.outlineWidth, eid)),
        overflowWrap: read(NetworkedText.overflowWrap, eid),
        side: read(NetworkedText.side, eid),
        strokeColor: read(NetworkedText.strokeColor, eid),
        strokeOpacity: read(NetworkedText.strokeOpacity, eid),
        strokeWidth: APP.getString(read(NetworkedText.strokeWidth, eid)),
        textAlign: read(NetworkedText.textAlign, eid),
        textIndent: read(NetworkedText.textIndent, eid),
        value: read(NetworkedText.text, eid),
        whiteSpace: read(NetworkedText.whiteSpace, eid)
      }
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
