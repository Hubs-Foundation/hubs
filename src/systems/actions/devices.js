import { keyboardBindDefn, mouseBindDefn, touchscreenBindDefn } from "./bindDefns";
import { fillActionFrame } from "./utils";
import { framify as keyboardFramify, actionForBinding as keyboardActionForBinding } from "./keyboard";
import { framify as mouseFramify, actionForBinding as mouseActionForBinding } from "./mouse";
import { framify as touchscreenFramify, actionForBinding as touchscreenActionForBinding } from "./touchscreen";
// import { framify as touchscreenFramify } from "./touchscreen/utils";

const keyboardEvents = [];
["keydown", "keyup", "blur"].map(x => document.addEventListener(x, keyboardEvents.push.bind(keyboardEvents)));
export const keyboard = {
  name: "keyboard",
  bindDefn: keyboardBindDefn,
  eventQueue: keyboardEvents,
  frame: {},
  prevFrame: {},
  framify: keyboardFramify,
  actionForBinding: keyboardActionForBinding
};
keyboard.fillActionFrame = fillActionFrame.bind(keyboard);

const mouseEvents = [];
["mousedown", "mouseup", "mousemove", "wheel"].map(x =>
  document.addEventListener(x, mouseEvents.push.bind(mouseEvents))
);
export const mouse = {
  name: "mouse",
  bindDefn: mouseBindDefn,
  eventQueue: mouseEvents,
  frame: {},
  prevFrame: {},
  framify: mouseFramify,
  actionForBinding: mouseActionForBinding
};
mouse.fillActionFrame = fillActionFrame.bind(mouse);

const touchEvents = [];
["touchdown", "touchup", "touchmove", "touchcancel"].map(x =>
  document.addEventListener(x, touchEvents.push.bind(touchEvents))
);
export const touchscreen = {
  name: "touchscreen",
  bindDefn: touchscreenBindDefn,
  eventQueue: touchEvents,
  frame: {},
  prevFrame: {},
  framify: touchscreenFramify,
  actionForBinding: touchscreenActionForBinding
};
touchscreen.fillActionFrame = fillActionFrame.bind(touchscreen);

export const go = {};
