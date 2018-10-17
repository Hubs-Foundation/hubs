import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";

const lButton = paths.device.vive.left.button;
const lAxis = paths.device.vive.left.axis;
const rButton = paths.device.vive.left.button;
const rAxis = paths.device.vive.left.axis;

const v = name => {
  return `/vive-user/vive-var/${name}`;
};
const rJoy = v("right/joy");
const lJoyXScaled = v("left/joyX/scaled");
const lJoyYScaled = v("left/joyY/scaled");
const rDpadNorth = v("/right/dpad/north");
const rDpadSouth = v("/right/dpad/south");
const rDpadEast = v("/right/dpad/east");
const rDpadWest = v("/right/dpad/west");
const rDpadCenter = v("/right/dpad/center");
const rSnapRight = v("right/snap-right");
const rSnapLeft = v("left/snap-left");
const rTouchpadRising = v("right/touchpad-rising");

const k = name => {
  return `/vive-user/keyboard-var/${name}`;
};
const keyboardSnapRight = k("snap-right");
const keyboardSnapLeft = k("snap-left");

export const viveUserBindings = {
  [sets.global]: [
    {
      src: {
        x: rAxis("joyX"),
        y: rAxis("joyY")
      },
      dest: {
        value: rJoy
      },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: rJoy
      },
      dest: {
        north: rDpadNorth,
        south: rDpadSouth,
        east: rDpadEast,
        west: rDpadWest,
        center: rDpadCenter
      },
      xform: xforms.vec2dpad(0.2)
    },
    {
      src: {
        value: rButton("touchpad").pressed
      },
      dest: {
        rTouchpadRising
      },
      xform: xforms.rising
    },
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadEast
      },
      dest: {
        value: rSnapRight
      },
      xform: xforms.copyIfTrue,
      root: rDpadEast,
      priority: 100
    },
    {
      src: { value: paths.device.keyboard.key("e") },
      dest: { value: keyboardSnapRight },
      xform: xforms.rising
    },
    {
      src: [rSnapRight, keyboardSnapRight],
      dest: { value: paths.actions.snapRotateRight },
      xform: xforms.any
    },
    {
      src: {
        value: rButton("touchpad").pressed
      },
      dest: {
        rTouchpadRising
      },
      xform: xforms.rising
    },
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadWest
      },
      dest: {
        value: rSnapLeft
      },
      xform: xforms.copyIfTrue,
      root: rDpadWest,
      priority: 100
    },
    {
      src: { value: paths.device.keyboard.key("q") },
      dest: { value: keyboardSnapLeft },
      xform: xforms.rising
    },
    {
      src: [rSnapLeft, keyboardSnapLeft],
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.any
    }
  ]
};
