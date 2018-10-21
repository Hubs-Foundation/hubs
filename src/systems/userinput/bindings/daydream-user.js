import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";

// vars
const v = s => `/vars/daydream/${s}`;
const touchpad = v("touchpad");
const touchpadPressed = v("touchpadPressed");
const touchpadReleased = v("touchpadReleased");
const dpadNorth = v("dpad/north");
const dpadSouth = v("dpad/south");
const dpadEast = v("dpad/east");
const dpadWest = v("dpad/west");
const dpadCenter = v("dpad/center");
const vec2zero = "/vars/vec2zero";
const brushSizeDelta = v("brushSizeDelta");
const cursorModDelta = v("cursorModDelta");
const dpadSouthDrop = v("dpad/southDrop");
const dpadCenterDrop = v("dpad/centerDrop");

// roots
const dpadEastRoot = "daydreamDpadEast";
const dpadWestRoot = "daydreamDpadWest";
const dpadCenterRoot = "daydreamDpadCenter";
const touchpadFallingRoot = "daydreamTouchpadFalling";
const cursorModDeltaRoot = "daydreamCursorModDeltaRoot";

const grabBinding = [
  {
    src: { value: dpadCenter, bool: touchpadPressed },
    dest: { value: paths.actions.cursor.grab },
    xform: xforms.copyIfTrue,
    root: dpadCenterRoot,
    priority: 200
  }
];

const dropOnCenterOrSouth = [
  {
    src: { value: dpadCenter, bool: touchpadPressed },
    dest: { value: dpadCenterDrop },
    xform: xforms.copyIfTrue
  },
  {
    src: { value: dpadSouth, bool: touchpadPressed },
    dest: { value: dpadSouthDrop },
    xform: xforms.copyIfTrue
  },
  {
    src: [dpadCenterDrop, dpadSouthDrop],
    dest: { value: paths.actions.cursor.drop },
    xform: xforms.any
  }
];

export const daydreamUserBindings = {
  [sets.global]: [
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
      dest: { value: touchpadPressed },
      xform: xforms.rising
    },
    {
      src: {
        value: paths.device.daydream.button("touchpad").pressed
      },
      dest: { value: touchpadReleased },
      xform: xforms.falling
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
        bool: touchpadPressed
      },
      dest: {
        value: paths.actions.snapRotateRight
      },
      xform: xforms.copyIfTrue,
      root: dpadEastRoot,
      priority: 100
    },
    {
      src: {
        value: dpadWest,
        bool: touchpadPressed
      },
      dest: {
        value: paths.actions.snapRotateLeft
      },
      xform: xforms.copyIfTrue,
      root: dpadWestRoot,
      priority: 100
    },
    {
      src: {
        value: dpadCenter,
        bool: touchpadPressed
      },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.copyIfTrue,
      root: dpadCenterRoot,
      priority: 100
    },
    {
      dest: { value: vec2zero },
      xform: xforms.always([0, -0.2])
    },
    {
      src: { value: vec2zero },
      dest: { value: paths.actions.cursor.pose },
      xform: xforms.poseFromCameraProjection()
    },
    {
      src: { value: paths.device.daydream.pose },
      dest: { value: paths.actions.cursor.pose },
      xform: xforms.copy
    }
  ],

  [sets.cursorHoveringOnInteractable]: grabBinding,
  [sets.cursorHoveringOnUI]: grabBinding,

  [sets.cursorHoldingInteractable]: [
    {
      src: { value: paths.device.daydream.button("touchpad").pressed },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.falling,
      root: touchpadFallingRoot,
      priority: 100
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
      dest: { value: paths.actions.cursor.modDelta },
      xform: xforms.copy,
      root: cursorModDeltaRoot,
      priority: 100
    }
  ],

  [sets.rightHandTeleporting]: [
    {
      src: { value: paths.device.daydream.button("touchpad").pressed },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.falling,
      root: touchpadFallingRoot,
      priority: 100
    }
  ],

  [sets.cursorHoldingPen]: [
    {
      src: { value: dpadNorth, bool: touchpadPressed },
      dest: { value: paths.actions.cursor.startDrawing },
      xform: xforms.copyIfTrue,
      root: dpadCenterRoot,
      priority: 300
    },
    {
      src: { value: touchpadReleased },
      dest: { value: paths.actions.cursor.stopDrawing },
      xform: xforms.copy,
      root: touchpadFallingRoot,
      priority: 300
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
        bool: paths.device.daydream.button("touchpad").pressed
      },
      dest: { value: paths.actions.cursor.scalePenTip },
      xform: xforms.copyIfFalse
    },
    {
      src: { value: dpadEast, bool: touchpadPressed },
      dest: {
        value: paths.actions.cursor.penPrevColor
      },
      xform: xforms.copyIfTrue,
      root: dpadEastRoot,
      priority: 200
    },
    {
      src: { value: dpadWest, bool: touchpadPressed },
      dest: {
        value: paths.actions.cursor.penNextColor
      },
      xform: xforms.copyIfTrue,
      root: dpadWestRoot,
      priority: 200
    },
    {
      src: {
        value: cursorModDelta,
        bool: paths.device.daydream.button("touchpad").pressed
      },
      dest: { value: paths.actions.cursor.modDelta },
      xform: xforms.copyIfFalse,
      root: cursorModDeltaRoot,
      priority: 200
    },
    ...dropOnCenterOrSouth
  ],

  [sets.cursorHoldingCamera]: [
    // Don't drop on touchpad release
    {
      src: {
        value: paths.device.daydream.button("touchpad").pressed
      },
      xform: xforms.noop,
      root: touchpadFallingRoot,
      priority: 300
    },
    {
      src: {
        value: dpadNorth,
        bool: touchpadPressed
      },
      dest: { value: paths.actions.cursor.takeSnapshot },
      xform: xforms.copyIfTrue,
      root: dpadCenterRoot,
      priority: 300
    },
    ...dropOnCenterOrSouth
  ]
};
