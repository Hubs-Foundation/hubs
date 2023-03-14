import { addComponent } from "bitecs";
import { BackSide, DoubleSide, FrontSide } from "three";
import { Text as TroikaText } from "troika-three-text";
import { HubsWorld } from "../app";
import { TextTag } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";

export type TextParams = {
  value: string;
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "top-baseline" | "top-cap" | "top-ex" | "middle" | "bottom-baseline" | "bottom";
  clipRect?: [number, number, number, number] | null;
  color?: string;
  curveRadius?: number;
  depthOffset?: number;
  direction?: "auto" | "ltr" | "trl";
  fillOpacity?: number;
  fontUrl?: string | null;
  fontSize?: number;
  glyphGeometryDetail?: number;
  gpuAccelerateSDF?: boolean;
  letterSpacing?: number;
  lineHeight?: number | "normal";
  maxWidth?: number;
  opacity?: number;
  outlineBlur?: number | `${number}%`;
  outlineColor?: string;
  outlineOffsetX?: number | `${number}%`;
  outlineOffsetY?: number | `${number}%`;
  outlineOpacity?: number;
  outlineWidth?: number | `${number}%`;
  overflowWrap?: "normal" | "break-word";
  sdfGlyphSize?: number | null;
  side?: "front" | "back" | "double";
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth?: number | `${number}%`;
  textAlign?: "left" | "right" | "center" | "justify";
  textIndent?: number;
  whiteSpace?: "normal" | "nowrap";
};

const THREE_SIDES = {
  front: FrontSide,
  back: BackSide,
  double: DoubleSide
};

const DEFAULTS: Required<TextParams> = {
  anchorX: "center",
  anchorY: "middle",
  clipRect: null,
  color: "#ffffff",
  curveRadius: 0,
  depthOffset: 0,
  direction: "auto",
  fillOpacity: 1.0,
  fontUrl: null,
  fontSize: 0.075,
  glyphGeometryDetail: 1.0,
  gpuAccelerateSDF: true,
  letterSpacing: 0,
  lineHeight: "normal",
  maxWidth: Infinity,
  opacity: 1.0,
  outlineBlur: 0,
  outlineColor: "#000000",
  outlineOffsetX: 0,
  outlineOffsetY: 0,
  outlineOpacity: 1.0,
  outlineWidth: 0,
  overflowWrap: "normal",
  sdfGlyphSize: null,
  side: "front",
  strokeColor: "grey",
  strokeOpacity: 1.0,
  strokeWidth: 0,
  textAlign: "center",
  textIndent: 0,
  value: "",
  whiteSpace: "normal"
};

export function inflateText(world: HubsWorld, eid: number, params: TextParams) {
  const requiredParams = Object.assign({}, DEFAULTS, params) as Required<TextParams>;
  const text = new TroikaText();
  text.material!.toneMapped = false;

  text.text = requiredParams.value;
  text.material!.side = THREE_SIDES[requiredParams.side];
  text.material!.opacity = requiredParams.opacity;
  text.font = requiredParams.fontUrl;

  text.anchorX = requiredParams.anchorX;
  text.anchorY = requiredParams.anchorY;
  text.clipRect = requiredParams.clipRect;
  text.color = requiredParams.color;
  text.curveRadius = requiredParams.curveRadius;
  text.depthOffset = requiredParams.depthOffset;
  text.direction = requiredParams.direction;
  text.fillOpacity = requiredParams.fillOpacity;
  text.fontSize = requiredParams.fontSize;
  text.glyphGeometryDetail = requiredParams.glyphGeometryDetail;
  text.gpuAccelerateSDF = requiredParams.gpuAccelerateSDF;
  text.letterSpacing = requiredParams.letterSpacing;
  text.lineHeight = requiredParams.lineHeight;
  text.maxWidth = requiredParams.maxWidth;
  text.outlineBlur = requiredParams.outlineBlur;
  text.outlineColor = requiredParams.outlineColor;
  text.outlineOffsetX = requiredParams.outlineOffsetX;
  text.outlineOffsetY = requiredParams.outlineOffsetY;
  text.outlineOpacity = requiredParams.outlineOpacity;
  text.outlineWidth = requiredParams.outlineWidth;
  text.overflowWrap = requiredParams.overflowWrap;
  text.sdfGlyphSize = requiredParams.sdfGlyphSize;
  text.strokeColor = requiredParams.strokeColor;
  text.strokeOpacity = requiredParams.strokeOpacity;
  text.strokeWidth = requiredParams.strokeWidth;
  text.textAlign = requiredParams.textAlign;
  text.textIndent = requiredParams.textIndent;
  text.whiteSpace = requiredParams.whiteSpace;

  text.sync();

  addComponent(world, TextTag, eid);
  addObject3DComponent(world, eid, text);
}
