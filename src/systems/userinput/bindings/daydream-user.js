import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

// vars
const v = s => `/vars/daydream/${s}`;
const touchpad = v("touchpad/axis");
const touchpadRising = v("touchpad/rising");
const touchpadFalling = v("touchpad/falling");
const touchpadPressed = v("touchpad/pressed");
const dpadNorth = v("dpad/north");
const dpadSouth = v("dpad/south");
const dpadEast = v("dpad/east");
const dpadWest = v("dpad/west");
const dpadCenter = v("dpad/center");
const brushSizeDelta = v("brushSizeDelta");
const cursorModDelta = v("cursorModDelta");
const dpadSouthDrop = v("dropSouth");
const dpadCenterDrop = v("dropCenter");

const grabBinding = [
  {
    src: { value: dpadCenter, bool: touchpadRising },
    dest: { value: paths.actions.cursor.right.grab },
    xform: xforms.copyIfTrue,
    priority: 100
  }
];

const dropOnCenterOrSouth = [
  {
    src: { value: dpadCenter, bool: touchpadRising },
    dest: { value: dpadCenterDrop },
    xform: xforms.copyIfTrue,
    priority: 100
  },
  {
    src: { value: dpadSouth, bool: touchpadRising },
    dest: { value: dpadSouthDrop },
    xform: xforms.copyIfTrue,
    priority: 100
  },
  {
    src: [dpadCenterDrop, dpadSouthDrop],
    dest: { value: paths.actions.cursor.right.drop },
    xform: xforms.any
  }
];

export const daydreamUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: { value: paths.device.daydream.matrix },
      dest: { value: paths.actions.rightHand.matrix },
      xform: xforms.copy
    },
    {
      src: {
        x: paths.device.daydream.axis("touchpadX"),
        y: paths.device.daydream.axis("touchpadY")
      },
      dest: { value: touchpad },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: paths.device.daydream.button("touchpad").pressed
      },
      dest: { value: touchpadRising },
      xform: xforms.rising
    },
    {
      src: {
        value: paths.device.daydream.button("touchpad").pressed
      },
      dest: { value: touchpadFalling },
      xform: xforms.falling
    },
    {
      src: {
        value: paths.device.daydream.button("touchpad").pressed
      },
      dest: { value: touchpadPressed },
      xform: xforms.copy
    },
    {
      src: {
        value: touchpad
      },
      dest: {
        north: dpadNorth,
        south: dpadSouth,
        east: dpadEast,
        west: dpadWest,
        center: dpadCenter
      },
      xform: xforms.vec2dpad(0.5)
    },
    {
      src: {
        value: dpadEast,
        bool: touchpadRising
      },
      dest: {
        value: paths.actions.snapRotateRight
      },
      xform: xforms.copyIfTrue
    },
    {
      src: {
        value: dpadWest,
        bool: touchpadRising
      },
      dest: {
        value: paths.actions.snapRotateLeft
      },
      xform: xforms.copyIfTrue
    },
    {
      src: {
        value: dpadCenter,
        bool: touchpadRising
      },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.copyIfTrue
    },
    {
      src: { value: paths.device.daydream.pose },
      dest: { value: paths.actions.cursor.right.pose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.daydream.pose },
      dest: { value: paths.actions.rightHand.pose },
      xform: xforms.copy
    }
  ],

  [sets.rightCursorHoveringOnInteractable]: grabBinding,
  [sets.rightCursorHoveringOnUI]: grabBinding,

  [sets.rightCursorHoveringOnVideo]: [
    {
      src: {
        value: paths.device.daydream.axis("touchpadY"),
        touching: paths.device.daydream.button("touchpad").touched
      },
      dest: { value: paths.actions.cursor.right.mediaVolumeMod },
      xform: xforms.touch_axis_scroll(-0.1)
    }
  ],

  [sets.rightCursorHoldingInteractable]: [
    {
      src: { value: touchpadFalling },
      dest: { value: paths.actions.cursor.right.drop },
      xform: xforms.copy
    },
    {
      src: {
        value: paths.device.daydream.axis("touchpadY"),
        touching: paths.device.daydream.button("touchpad").touched
      },
      dest: { value: cursorModDelta },
      xform: xforms.touch_axis_scroll()
    },
    {
      src: { value: cursorModDelta },
      dest: { value: paths.actions.cursor.right.modDelta },
      xform: xforms.copy
    }
  ],

  [sets.rightHandTeleporting]: [
    {
      src: { value: touchpadFalling },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.copy
    }
  ],

  [sets.rightCursorHoldingPen]: [
    {
      src: { value: dpadNorth, bool: touchpadRising },
      dest: { value: paths.actions.cursor.right.startDrawing },
      xform: xforms.copyIfTrue,
      priority: 100
    },
    {
      src: { value: touchpadFalling },
      dest: { value: paths.actions.cursor.right.stopDrawing },
      xform: xforms.copy,
      priority: 100
    },
    {
      src: {
        value: paths.device.daydream.axis("touchpadX"),
        touching: paths.device.daydream.button("touchpad").touched
      },
      dest: { value: brushSizeDelta },
      xform: xforms.touch_axis_scroll(-0.1)
    },
    {
      src: {
        value: brushSizeDelta,
        bool: touchpadPressed
      },
      dest: { value: paths.actions.cursor.right.scalePenTip },
      xform: xforms.copyIfFalse,
      priority: 100
    },
    {
      src: { value: dpadEast, bool: touchpadRising },
      dest: {
        value: paths.actions.cursor.right.penPrevColor
      },
      xform: xforms.copyIfTrue,
      priority: 100
    },
    {
      src: { value: dpadWest, bool: touchpadRising },
      dest: {
        value: paths.actions.cursor.right.penNextColor
      },
      xform: xforms.copyIfTrue,
      priority: 100
    },
    {
      src: {
        value: cursorModDelta,
        bool: touchpadPressed
      },
      dest: { value: paths.actions.cursor.right.modDelta },
      xform: xforms.copyIfFalse,
      priority: 100
    },
    ...dropOnCenterOrSouth
  ],

  [sets.rightCursorHoldingCamera]: [
    // Don't drop on touchpad release
    {
      src: {
        value: touchpadFalling
      },
      xform: xforms.noop,
      priority: 100
    },
    {
      src: {
        value: dpadNorth,
        bool: touchpadRising
      },
      dest: { value: paths.actions.cursor.right.takeSnapshot },
      xform: xforms.copy,
      priority: 100
    },
    ...dropOnCenterOrSouth
  ]
});
