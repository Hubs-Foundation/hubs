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

// Parameters from glTF are not type checked then needs to
// cast to ensure the data types. Otherwise text can look weird
// because of mismatched typed data.
// This type problem shouldn't be Text component specific.
// Ideally type check and cast should be done for all parameters
// in all (glTF) inflators. Also validation should be done.
// For now, we cast only number typed text parameters because we
// nooticed that they are sometimes passed as string types from
// glTF. If we notice problems with other parameters, we may add
// casting of other parameters.
// TODO: Add a generic mechanism to cast and validate inflator params.
const cast = (params: Required<TextParams>): Required<TextParams> => {
  const keys: Array<keyof TextParams> = [
    "curveRadius",
    "depthOffset",
    "fillOpacity",
    "fontSize",
    "glyphGeometryDetail",
    "letterSpacing",
    "lineHeight",
    "maxWidth",
    "opacity",
    "outlineBlur",
    "outlineOffsetX",
    "outlineOffsetY",
    "outlineOpacity",
    "outlineWidth",
    "sdfGlyphSize",
    "strokeOpacity",
    "strokeWidth",
    "textIndent"
  ];

  for (const key of keys) {
    let value = params[key];
    if (value === null || value === undefined) {
      continue;
    }
    value = Number(value);
    if (isNaN(value)) {
      continue;
    }
    // Compile error if remove any.
    //   TS2322: Type 'number' is not assignable to type 'never'.
    // Any proper and reasonable solution?
    (params as any)[key] = value;
  }

  return params;
};

export function inflateText(world: HubsWorld, eid: number, params: TextParams) {
  const requiredParams = cast(Object.assign({}, DEFAULTS, params) as Required<TextParams>);
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
