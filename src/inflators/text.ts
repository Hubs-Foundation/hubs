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
  textAlign?: 'left' | 'right' | 'center' | 'justify';
  textIndent?: number;
  whiteSpace?: "normal" | "nowrap";
};

const THREE_SIDES = {
  front: FrontSide,
  back: BackSide,
  double: DoubleSide
};

// Defaults values must be set for all the optional properties
// to safely use foo! operator in the inflator.
const DEFAULTS: TextParams = {
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
  params = Object.assign({}, DEFAULTS, params);
  const text = new TroikaText();
  text.material!.toneMapped = false;

  text.text = params.value;
  text.material!.side = THREE_SIDES[params.side!];
  text.material!.opacity = params.opacity!;
  text.font = params.fontUrl!;

  text.anchorX = params.anchorX!;
  text.anchorY = params.anchorY!;
  text.clipRect = params.clipRect!;
  text.color = params.color!;
  text.curveRadius = params.curveRadius!;
  text.depthOffset = params.depthOffset!;
  text.direction = params.direction!;
  text.fillOpacity = params.fillOpacity!;
  text.fontSize = params.fontSize!;
  text.glyphGeometryDetail = params.glyphGeometryDetail!;
  text.gpuAccelerateSDF = params.gpuAccelerateSDF!;
  text.letterSpacing = params.letterSpacing!;
  text.lineHeight = params.lineHeight!;
  text.maxWidth = params.maxWidth!;
  text.outlineBlur = params.outlineBlur!;
  text.outlineColor = params.outlineColor!;
  text.outlineOffsetX = params.outlineOffsetX!;
  text.outlineOffsetY = params.outlineOffsetY!;
  text.outlineOpacity = params.outlineOpacity!;
  text.outlineWidth = params.outlineWidth!;
  text.overflowWrap = params.overflowWrap!;
  text.sdfGlyphSize = params.sdfGlyphSize!;
  text.strokeColor = params.strokeColor!;
  text.strokeOpacity = params.strokeOpacity!;
  text.strokeWidth = params.strokeWidth!;
  text.textAlign = params.textAlign!;
  text.textIndent = params.textIndent!;
  text.whiteSpace = params.whiteSpace!;
 
  text.sync();

  addComponent(world, TextTag, eid);
  addObject3DComponent(world, eid, text);
}
