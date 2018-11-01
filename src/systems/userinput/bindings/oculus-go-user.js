import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";

const touchpad = "/vars/oculusgo/touchpad";
const touchpadPressed = "/vars/oculusgo/touchpadPressed";
const touchpadReleased = "/vars/oculusgo/touchpadReleased";
const dpadNorth = "/vars/oculusgo/dpad/north";
const dpadSouth = "/vars/oculusgo/dpad/south";
const dpadEast = "/vars/oculusgo/dpad/east";
const dpadWest = "/vars/oculusgo/dpad/west";
const dpadCenter = "/vars/oculusgo/dpad/center";
const dpadCenterStrip = "/vars/oculusgo/dpad/centerStrip";

const triggerRisingRoot = "oculusGoTriggerRising";
const triggerFallingRoot = "oculusGoTriggerFalling";
const dpadEastRoot = "oculusGoDpadEast";
const dpadWestRoot = "oculusGoDpadWest";
const rootForFrozenOverrideWhenHolding = "rootForFrozenOverrideWhenHolding";

const grabBinding = {
  src: {
    value: paths.device.oculusgo.button("trigger").pressed
  },
  dest: { value: paths.actions.cursor.grab },
  xform: xforms.rising,
  root: triggerRisingRoot,
  priority: 200
};

export const oculusGoUserBindings = {
  [sets.global]: [
    {
      src: {
        x: paths.device.oculusgo.axis("touchpadX"),
        y: paths.device.oculusgo.axis("touchpadY")
      },
      dest: { value: touchpad },
      xform: xforms.compose_vec2
    },
    {
      src: [dpadNorth, dpadSouth, dpadCenter],
      dest: { value: dpadCenterStrip },
      xform: xforms.any
    },
    {
      src: {
        value: paths.device.oculusgo.button("touchpad").pressed
      },
      dest: { value: touchpadPressed },
      xform: xforms.rising
    },
    {
      src: {
        value: paths.device.oculusgo.button("touchpad").pressed
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
      xform: xforms.vec2dpad(0.8)
    },
    {
      src: {
        value: dpadCenterStrip,
        bool: paths.device.oculusgo.button("touchpad").pressed
      },
      dest: {
        value: paths.actions.ensureFrozen
      },
      root: rootForFrozenOverrideWhenHolding,
      priority: 100
      xform: xforms.copyIfTrue
    },
    {
      src: { value: touchpadReleased },
      dest: {
        value: paths.actions.thaw
      },
      xform: xforms.copyIfTrue
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
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.rising,
      root: triggerRisingRoot,
      priority: 100
    },

    {
      src: { value: paths.device.oculusgo.pose },
      dest: { value: paths.actions.cursor.pose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.oculusgo.pose },
      dest: { value: paths.actions.rightHand.pose },
      xform: xforms.copy
    },

    {
      src: { value: paths.device.oculusgo.button("touchpad").touched },
      dest: { value: paths.actions.rightHand.thumb },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.oculusgo.button("trigger").pressed },
      dest: { value: paths.actions.rightHand.index },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.oculusgo.button("trigger").pressed },
      dest: { value: paths.actions.rightHand.middleRingPinky },
      xform: xforms.copy
    }
  ],

  [sets.cursorHoveringOnInteractable]: [grabBinding],
  [sets.cursorHoveringOnUI]: [grabBinding],

  [sets.cursorHoldingInteractable]: [
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.falling,
      root: triggerFallingRoot,
      priority: 200
    },
    {
      src: {
        value: paths.device.oculusgo.axis("touchpadY"),
        touching: paths.device.oculusgo.button("touchpad").touched
      },
      dest: { value: paths.actions.cursor.modDelta },
      xform: xforms.touch_axis_scroll()
    },
    {
      src: null,
      dest: { value: paths.actions.ensureFrozen },
      root: rootForFrozenOverrideWhenHolding,
      priority: 200,
      xform: xforms.always(false)
    }
  ],

  [sets.rightHandTeleporting]: [
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.falling,
      root: triggerFallingRoot,
      priority: 100
    }
  ],

  [sets.cursorHoldingPen]: [
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: paths.actions.cursor.startDrawing },
      xform: xforms.rising,
      root: triggerRisingRoot,
      priority: 300
    },
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: paths.actions.cursor.stopDrawing },
      xform: xforms.falling,
      root: triggerFallingRoot,
      priority: 300
    },
    {
      src: {
        value: paths.device.oculusgo.axis("touchpadX"),
        touching: paths.device.oculusgo.button("touchpad").touched
      },
      dest: { value: paths.actions.cursor.scalePenTip },
      xform: xforms.touch_axis_scroll(-0.1)
    },
    {
      src: {
        value: dpadCenter,
        bool: touchpadPressed
      },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.copyIfTrue
    },
    {
      src: {
        value: dpadEast,
        bool: touchpadPressed
      },
      dest: {
        value: paths.actions.cursor.penPrevColor
      },
      xform: xforms.copyIfTrue,
      root: dpadEastRoot,
      priority: 200
    },
    {
      src: {
        value: dpadWest,
        bool: touchpadPressed
      },
      dest: {
        value: paths.actions.cursor.penNextColor
      },
      xform: xforms.copyIfTrue,
      root: dpadWestRoot,
      priority: 200
    }
  ],

  [sets.cursorHoldingCamera]: [
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: paths.actions.cursor.takeSnapshot },
      xform: xforms.rising,
      root: triggerRisingRoot,
      priority: 300
    },
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      xform: xforms.noop,
      root: triggerFallingRoot,
      priority: 300
    },
    {
      src: {
        value: dpadCenter,
        bool: touchpadPressed
      },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.copyIfTrue
    }
  ]
};
