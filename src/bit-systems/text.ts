import { defineQuery } from "bitecs";
import { Text as TroikaText } from "troika-three-text";
import { HubsWorld } from "../app";
import { NetworkedText, TextTag } from "../bit-components";
import {
  NumberOrNormalT,
  NumberOrPctT,
  SIDE_TO_THREE,
  flagToAnchorX,
  flagToAnchorY,
  flagToDirection,
  flagToOverflowWrap,
  flagToSide,
  flagToTextAlign,
  flagToWhiteSpace,
  stringToNumberOrString
} from "../inflators/text";

const textQuery = defineQuery([TextTag]);
const networkedTextQuery = defineQuery([TextTag, NetworkedText]);

export function textSystem(world: HubsWorld) {
  textQuery(world).forEach(eid => {
    const text = world.eid2obj.get(eid)! as TroikaText;

    // sync() invokes async text processing in workers.
    // https://github.com/protectwise/troika/tree/main/packages/troika-three-text#handling-asynchronous-updates
    //
    // It is safe to call sync() every frame from the
    // performance and efficiency perspective because
    // sync() checks whether to invoke costly processing
    // inside.
    //
    // Ideally this system should run after any other systems
    // that can update text properties and we need to be careful
    // for the systems execution order. Otherwise sync() call
    // can happen one frame after. (But probably it may not be
    // a big deal even if it happens because what sync() invokes
    // is async processing, texture properties update will be
    // reflected some frames after in any case.)
    //
    // Assumes it is safe even if text object is
    // disposed before the async processing is done
    // because TroikaText properly handles
    text.sync();
  });
  networkedTextQuery(world).forEach(eid => {
    const text = world.eid2obj.get(eid)! as TroikaText;
    const newText = APP.getString(NetworkedText.text[eid]);
    if (text.text !== newText) {
      text.text = newText!;
    }
    if (text.fontSize !== NetworkedText.fontSize[eid]) {
      text.fontSize = NetworkedText.fontSize[eid];
    }
    const textAlign = flagToTextAlign(NetworkedText.textAlign[eid]);
    if (text.textAlign !== textAlign) {
      text.textAlign = textAlign;
    }
    const anchorX = flagToAnchorX(NetworkedText.anchorX[eid]);
    if (text.anchorX !== anchorX) {
      text.anchorX = anchorX;
    }
    const anchorY = flagToAnchorY(NetworkedText.anchorY[eid]);
    if (text.anchorY !== anchorY) {
      text.anchorY = anchorY;
    }
    if (text.color !== NetworkedText.color[eid]) {
      text.color = NetworkedText.color[eid];
    }
    if (text.letterSpacing !== NetworkedText.letterSpacing[eid]) {
      text.letterSpacing = NetworkedText.letterSpacing[eid];
    }
    const lineHeight = stringToNumberOrString(APP.getString(NetworkedText.lineHeight[eid])!) as NumberOrNormalT;
    if (text.lineHeight !== lineHeight) {
      text.lineHeight = lineHeight;
    }
    const outlineWidth = stringToNumberOrString(APP.getString(NetworkedText.outlineWidth[eid])!) as NumberOrPctT;
    if (text.outlineWidth !== outlineWidth) {
      text.outlineWidth = outlineWidth;
    }
    if (text.outlineColor !== NetworkedText.outlineColor[eid]) {
      text.outlineColor = NetworkedText.outlineColor[eid];
    }
    const outlineBlur = stringToNumberOrString(APP.getString(NetworkedText.outlineBlur[eid])!) as NumberOrPctT;
    if (text.outlineBlur !== outlineBlur) {
      text.outlineBlur = outlineBlur;
    }
    const outlineOffsetX = stringToNumberOrString(APP.getString(NetworkedText.outlineOffsetX[eid])!) as NumberOrPctT;
    if (text.outlineOffsetX !== outlineOffsetX) {
      text.outlineOffsetX = outlineOffsetX;
    }
    const outlineOffsetY = stringToNumberOrString(APP.getString(NetworkedText.outlineOffsetY[eid])!) as NumberOrPctT;
    if (text.outlineOffsetY !== outlineOffsetY) {
      text.outlineOffsetY = outlineOffsetY;
    }
    if (text.outlineOpacity !== NetworkedText.outlineOpacity[eid]) {
      text.outlineOpacity = NetworkedText.outlineOpacity[eid];
    }
    if (text.fillOpacity !== NetworkedText.fillOpacity[eid]) {
      text.fillOpacity = NetworkedText.fillOpacity[eid];
    }
    const strokeWidth = stringToNumberOrString(APP.getString(NetworkedText.strokeWidth[eid])!) as NumberOrPctT;
    if (text.strokeWidth !== strokeWidth) {
      text.strokeWidth = strokeWidth;
    }
    if (text.strokeColor !== NetworkedText.strokeColor[eid]) {
      text.strokeColor = NetworkedText.strokeColor[eid];
    }
    if (text.strokeOpacity !== NetworkedText.strokeOpacity[eid]) {
      text.strokeOpacity = NetworkedText.strokeOpacity[eid];
    }
    if (text.textIndent !== NetworkedText.textIndent[eid]) {
      text.textIndent = NetworkedText.textIndent[eid];
    }
    const whiteSpace = flagToWhiteSpace(NetworkedText.whiteSpace[eid]);
    if (text.whiteSpace !== whiteSpace) {
      text.whiteSpace = whiteSpace;
    }
    const overflowWrap = flagToOverflowWrap(NetworkedText.overflowWrap[eid]);
    if (text.overflowWrap !== overflowWrap) {
      text.overflowWrap = overflowWrap;
    }
    if (text.material!.opacity !== NetworkedText.opacity[eid]) {
      text.material!.opacity = NetworkedText.opacity[eid];
    }
    const side = SIDE_TO_THREE[flagToSide(NetworkedText.side[eid])];
    if (text.material!.side !== side) {
      text.material!.side = side;
    }
    if (text.maxWidth !== NetworkedText.maxWidth[eid]) {
      text.maxWidth = NetworkedText.maxWidth[eid];
    }
    if (text.curveRadius !== NetworkedText.curveRadius[eid]) {
      text.curveRadius = NetworkedText.curveRadius[eid];
    }
    const direction = flagToDirection(NetworkedText.direction[eid]);
    if (text.direction !== direction) {
      text.direction = direction;
    }
    text.sync();
  });
}
