import { addComponent } from "bitecs";
import { BackSide, Color, DoubleSide, FrontSide, Side } from "three";
import { Text as TroikaText } from "troika-three-text";
import { HubsWorld } from "../app";
import { Networked, NetworkedText, TextTag } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";

export const ANCHOR_X = {
  LEFT: 1 << 0,
  CENTER: 1 << 1,
  RIGHT: 1 << 2
};

export function anchorXToFlag(anchorX: string) {
  switch (anchorX) {
    case "center":
      return ANCHOR_X.CENTER;
    case "left":
      return ANCHOR_X.LEFT;
    case "right":
      return ANCHOR_X.RIGHT;
  }
  return ANCHOR_X.CENTER;
}

export function flagToAnchorX(flag: number) {
  switch (flag) {
    case ANCHOR_X.CENTER:
      return "center";
    case ANCHOR_X.LEFT:
      return "left";
    case ANCHOR_X.RIGHT:
      return "right";
  }
  return "center";
}

export const ANCHOR_Y = {
  TOP: 1 << 0,
  TOP_BASELINE: 1 << 1,
  TOP_CAP: 1 << 2,
  TOP_EX: 1 << 3,
  MIDDLE: 1 << 4,
  BOTTOM_BASELINE: 1 << 5,
  BOTTOM: 1 << 6
};

export function anchorYToFlag(anchorY: string) {
  switch (anchorY) {
    case "top":
      return ANCHOR_Y.TOP;
    case "top-baseline":
      return ANCHOR_Y.TOP_BASELINE;
    case "top-cap":
      return ANCHOR_Y.TOP_CAP;
    case "top-ex":
      return ANCHOR_Y.TOP_EX;
    case "middle":
      return ANCHOR_Y.MIDDLE;
    case "bottom-baseline":
      return ANCHOR_Y.BOTTOM_BASELINE;
    case "bottom":
      return ANCHOR_Y.BOTTOM;
  }
  return ANCHOR_Y.MIDDLE;
}

export function flagToAnchorY(flag: number) {
  switch (flag) {
    case ANCHOR_Y.TOP:
      return "top";
    case ANCHOR_Y.TOP_BASELINE:
      return "top-baseline";
    case ANCHOR_Y.TOP_CAP:
      return "top-cap";
    case ANCHOR_Y.TOP_EX:
      return "top-ex";
    case ANCHOR_Y.MIDDLE:
      return "middle";
    case ANCHOR_Y.BOTTOM_BASELINE:
      return "bottom-baseline";
    case ANCHOR_Y.BOTTOM:
      return "bottom";
  }
  return "middle";
}

export const DIRECTION = {
  AUTO: 1 << 0,
  LTR: 1 << 1,
  RTL: 1 << 2
};

export function directionToFlag(direction: string) {
  switch (direction) {
    case "auto":
      return DIRECTION.AUTO;
    case "ltr":
      return DIRECTION.LTR;
    case "rtl":
      return DIRECTION.RTL;
  }
  return DIRECTION.AUTO;
}

export function flagToDirection(flag: number) {
  switch (flag) {
    case DIRECTION.AUTO:
      return "auto";
    case DIRECTION.LTR:
      return "ltr";
    case DIRECTION.RTL:
      return "rtl";
  }
  return "auto";
}

export const OVERFLOW_WRAP = {
  NORMAL: 1 << 0,
  BREAK_WORD: 1 << 1
};

export function overflowWrapToFlag(overflowWrap: string) {
  switch (overflowWrap) {
    case "normal":
      return OVERFLOW_WRAP.NORMAL;
    case "break-word":
      return OVERFLOW_WRAP.BREAK_WORD;
  }
  return OVERFLOW_WRAP.NORMAL;
}

export function flagToOverflowWrap(flag: number) {
  switch (flag) {
    case OVERFLOW_WRAP.NORMAL:
      return "normal";
    case OVERFLOW_WRAP.BREAK_WORD:
      return "break-word";
  }
  return "normal";
}

export const SIDE = {
  FRONT: 1 << 0,
  BACK: 1 << 1,
  DOUBLE: 1 << 2
};

export function sideToFlag(side: string) {
  switch (side) {
    case "front":
      return SIDE.FRONT;
    case "back":
      return SIDE.BACK;
    case "double":
      return SIDE.DOUBLE;
  }
  return SIDE.FRONT;
}

export function flagToSide(flag: number) {
  switch (flag) {
    case SIDE.FRONT:
      return "front";
    case SIDE.BACK:
      return "back";
    case SIDE.DOUBLE:
      return "double";
  }
  return "front";
}

export const TEXT_ALIGN = {
  LEFT: 1 << 0,
  RIGHT: 1 << 1,
  CENTER: 1 << 2,
  JUSTIFY: 1 << 2
};

export function textAlignToFlag(textAlign: string) {
  switch (textAlign) {
    case "left":
      return TEXT_ALIGN.LEFT;
    case "right":
      return TEXT_ALIGN.RIGHT;
    case "center":
      return TEXT_ALIGN.CENTER;
    case "justify":
      return TEXT_ALIGN.JUSTIFY;
  }
  return TEXT_ALIGN.CENTER;
}

export function flagToTextAlign(flag: number) {
  switch (flag) {
    case TEXT_ALIGN.LEFT:
      return "left";
    case TEXT_ALIGN.RIGHT:
      return "right";
    case TEXT_ALIGN.CENTER:
      return "center";
    case TEXT_ALIGN.JUSTIFY:
      return "justify";
  }
  return "center";
}

export const WHITESPACE = {
  NORMAL: 1 << 0,
  NO_WRAP: 1 << 1
};

export function whiteSpaceToFlag(whiteSpace: string) {
  switch (whiteSpace) {
    case "normal":
      return WHITESPACE.NORMAL;
    case "nowrap":
      return WHITESPACE.NO_WRAP;
  }
  return WHITESPACE.NORMAL;
}

export function flagToWhiteSpace(flag: number) {
  switch (flag) {
    case WHITESPACE.NORMAL:
      return "normal";
    case WHITESPACE.NO_WRAP:
      return "nowrap";
  }
  return "normal";
}

export function numberOrStringToString(value: number | string) {
  if (isNaN(Number(value))) {
    return APP.getSid(value as string);
  } else {
    return APP.getSid(`${value as number}`);
  }
}

export function stringToNumberOrString(value: string): number | string {
  if (!value) return 0;
  if (value.indexOf("%") !== -1) {
    return value;
  } else {
    return Number(value);
  }
}

export type NumberOrNormalT = number | "normal";
export type NumberOrPctT = number | `${number}%`;

export type TextParams = {
  value: string;
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "top-baseline" | "top-cap" | "top-ex" | "middle" | "bottom-baseline" | "bottom";
  clipRect?: [number, number, number, number] | null;
  color?: string;
  curveRadius?: number;
  depthOffset?: number;
  direction?: "auto" | "ltr" | "rtl";
  fillOpacity?: number;
  fontUrl?: string | null;
  fontSize?: number;
  glyphGeometryDetail?: number;
  gpuAccelerateSDF?: boolean;
  letterSpacing?: number;
  lineHeight?: NumberOrNormalT;
  maxWidth?: number;
  opacity?: number;
  outlineBlur?: NumberOrPctT;
  outlineColor?: string;
  outlineOffsetX?: NumberOrPctT;
  outlineOffsetY?: NumberOrPctT;
  outlineOpacity?: number;
  outlineWidth?: NumberOrPctT;
  overflowWrap?: "normal" | "break-word";
  sdfGlyphSize?: number | null;
  side?: "front" | "back" | "double";
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth?: NumberOrPctT;
  textAlign?: "left" | "right" | "center" | "justify";
  textIndent?: number;
  whiteSpace?: "normal" | "nowrap";
};

export const THREE_SIDES = {
  front: FrontSide,
  back: BackSide,
  double: DoubleSide
};

export function sideToThree(side: "front" | "back" | "double"): Side {
  return THREE_SIDES[side];
}

export const THREE_TO_SIDE = {
  [FrontSide]: "front",
  [BackSide]: "back",
  [DoubleSide]: "double"
};

export function threeToSide(side: Side) {
  return THREE_TO_SIDE[side];
}

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
export const cast = (params: Required<TextParams>): Required<TextParams> => {
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

const tmpColor = new Color();
function createText(requiredParams: Required<TextParams>) {
  const text = new TroikaText();
  text.material!.toneMapped = false;

  text.text = requiredParams.value;
  text.material!.side = THREE_SIDES[requiredParams.side];
  text.material!.opacity = requiredParams.opacity;
  text.font = requiredParams.fontUrl;

  text.anchorX = requiredParams.anchorX;
  text.anchorY = requiredParams.anchorY;
  text.clipRect = requiredParams.clipRect;
  text.color = tmpColor.set(requiredParams.color).getHex();
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

  return text;
}

export function inflateText(world: HubsWorld, eid: number, params: TextParams) {
  const requiredParams = Object.assign({}, DEFAULTS, params) as Required<TextParams>;
  const text = createText(requiredParams);

  addComponent(world, TextTag, eid);
  addObject3DComponent(world, eid, text);
}

export function inflateGLTFText(world: HubsWorld, eid: number, params: TextParams) {
  const requiredParams = Object.assign({}, DEFAULTS, params) as Required<TextParams>;
  const text = createText(requiredParams);

  addComponent(world, TextTag, eid);
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedText, eid);
  addObject3DComponent(world, eid, text);

  NetworkedText.text[eid] = APP.getSid(requiredParams.value);
  NetworkedText.fontSize[eid] = requiredParams.fontSize;
  NetworkedText.textAlign[eid] = textAlignToFlag(requiredParams.textAlign);
  NetworkedText.anchorX[eid] = anchorXToFlag(requiredParams.anchorX);
  NetworkedText.anchorY[eid] = anchorYToFlag(requiredParams.anchorY);
  NetworkedText.color[eid] = tmpColor.set(requiredParams.color).getHex();
  NetworkedText.letterSpacing[eid] = requiredParams.letterSpacing;
  NetworkedText.lineHeight[eid] = numberOrStringToString(requiredParams.lineHeight);
  NetworkedText.outlineWidth[eid] = numberOrStringToString(requiredParams.outlineWidth);
  NetworkedText.outlineColor[eid] = tmpColor.set(requiredParams.outlineColor).getHex();
  NetworkedText.outlineBlur[eid] = numberOrStringToString(requiredParams.outlineBlur);
  NetworkedText.outlineOffsetX[eid] = numberOrStringToString(requiredParams.outlineOffsetX);
  NetworkedText.outlineOffsetY[eid] = numberOrStringToString(requiredParams.outlineOffsetY);
  NetworkedText.outlineOpacity[eid] = requiredParams.outlineOpacity;
  NetworkedText.fillOpacity[eid] = requiredParams.fillOpacity;
  NetworkedText.strokeWidth[eid] = numberOrStringToString(requiredParams.strokeWidth);
  NetworkedText.strokeColor[eid] = tmpColor.set(requiredParams.strokeColor).getHex();
  NetworkedText.strokeOpacity[eid] = requiredParams.strokeOpacity;
  NetworkedText.textIndent[eid] = requiredParams.textIndent;
  NetworkedText.whiteSpace[eid] = whiteSpaceToFlag(requiredParams.whiteSpace);
  NetworkedText.overflowWrap[eid] = overflowWrapToFlag(requiredParams.overflowWrap);
  NetworkedText.opacity[eid] = requiredParams.opacity;
  NetworkedText.side[eid] = sideToFlag(requiredParams.side);
  NetworkedText.maxWidth[eid] = requiredParams.maxWidth;
  NetworkedText.curveRadius[eid] = requiredParams.curveRadius;
  NetworkedText.direction[eid] = directionToFlag(requiredParams.direction);

  return eid;
}
