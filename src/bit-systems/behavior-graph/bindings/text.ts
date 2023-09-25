import { Text } from "troika-three-text";
import { HubsWorld } from "../../../app";
import { EntityID, NetworkedText } from "../../../bit-components";
import {
  SIDE_TO_THREE,
  THREE_TO_SIDE,
  TextParams,
  anchorXToFlag,
  anchorYToFlag,
  cast,
  directionToFlag,
  numberOrStringToString,
  overflowWrapToFlag,
  sideToFlag,
  textAlignToFlag,
  whiteSpaceToFlag
} from "../../../inflators/text";
import { Color } from "three";

export function getText(world: HubsWorld, eid: EntityID): Required<TextParams> {
  const text = world.eid2obj.get(eid) as Text;
  return {
    anchorX: text.anchorX,
    anchorY: text.anchorY,
    clipRect: text.clipRect,
    color: text.color,
    curveRadius: text.curveRadius,
    depthOffset: text.depthOffset,
    direction: text.direction,
    fillOpacity: text.fillOpacity,
    fontSize: text.fontSize,
    glyphGeometryDetail: text.glyphGeometryDetail,
    gpuAccelerateSDF: text.gpuAccelerateSDF,
    letterSpacing: text.letterSpacing,
    lineHeight: text.lineHeight,
    maxWidth: text.maxWidth,
    opacity: text.material!.opacity,
    outlineBlur: text.outlineBlur,
    outlineColor: text.outlineColor,
    outlineOffsetX: text.outlineOffsetX,
    outlineOffsetY: text.outlineOffsetX,
    outlineOpacity: text.outlineOpacity,
    outlineWidth: text.outlineWidth,
    overflowWrap: text.overflowWrap,
    sdfGlyphSize: text.sdfGlyphSize,
    side: THREE_TO_SIDE[text.material!.side],
    strokeColor: text.strokeColor,
    strokeOpacity: text.strokeOpacity,
    strokeWidth: text.strokeWidth,
    textAlign: text.textAlign,
    textIndent: text.textIndent,
    value: text.text,
    fontUrl: text.font,
    whiteSpace: text.whiteSpace
  } as Required<TextParams>;
}

const tmpColor = new Color();

export function setText(world: HubsWorld, eid: number, params: Partial<TextParams>) {
  const requiredParams = cast(Object.assign({}, getText(world, eid), params));

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

  const text = world.eid2obj.get(eid) as Text;
  text.text = requiredParams.value;
  text.material!.side = SIDE_TO_THREE[requiredParams.side];
  text.material!.opacity = requiredParams.opacity;
  if (requiredParams.fontUrl) {
    text.font = requiredParams.fontUrl;
  }

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
}
