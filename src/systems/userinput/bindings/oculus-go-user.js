import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

const touchpad = "/vars/oculusgo/touchpad";
const touchpadRising = "/vars/oculusgo/touchpad/rising";
const touchpadFalling = "/vars/oculusgo/touchpad/falling";
const triggerRising = "/vars/oculusgo/trigger/rising";
const triggerFalling = "/vars/oculusgo/trigger/falling";
const dpadNorth = "/vars/oculusgo/dpad/north";
const dpadSouth = "/vars/oculusgo/dpad/south";
const dpadEast = "/vars/oculusgo/dpad/east";
const dpadWest = "/vars/oculusgo/dpad/west";
const dpadCenter = "/vars/oculusgo/dpad/center";
const dpadCenterStrip = "/vars/oculusgo/dpad/centerStrip";

const grabBinding = {
  src: {
    value: triggerRising
  },
  dest: { value: paths.actions.cursor.grab },
  xform: xforms.copy,
  priority: 200
};

export const oculusGoUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: triggerRising },
      xform: xforms.rising
    },
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: triggerFalling },
      xform: xforms.falling
    },
    {
      src: {
        value: paths.device.oculusgo.button("touchpad").pressed
      },
      dest: { value: touchpadRising },
      xform: xforms.rising,
      priority: 100
    },
    {
      src: {
        value: paths.device.oculusgo.button("touchpad").pressed
      },
      dest: { value: touchpadFalling },
      xform: xforms.falling,
      priority: 100
    },
    {
      src: {
        x: paths.device.oculusgo.axis("touchpadX"),
        y: paths.device.oculusgo.axis("touchpadY")
      },
      dest: { value: touchpad },
      xform: xforms.compose_vec2
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
      src: [dpadNorth, dpadSouth, dpadCenter],
      dest: { value: dpadCenterStrip },
      xform: xforms.any
    },
    {
      src: {
        value: dpadCenterStrip,
        bool: paths.device.oculusgo.button("touchpad").pressed
      },
      dest: {
        value: paths.actions.ensureFrozen
      },
      priority: 100,
      xform: xforms.copyIfTrue
    },
    {
      src: { value: touchpadFalling },
      dest: {
        value: paths.actions.thaw
      },
      xform: xforms.copy
    },
    {
      src: {
        value: dpadEast,
        bool: touchpadRising
      },
      dest: {
        value: paths.actions.snapRotateRight
      },
      xform: xforms.copyIfTrue,
      priority: 100
    },
    {
      src: {
        value: dpadWest,
        bool: touchpadRising
      },
      dest: {
        value: paths.actions.snapRotateLeft
      },
      xform: xforms.copyIfTrue,
      priority: 100
    },

    {
      src: {
        value: triggerRising
      },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.copy,
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
        value: triggerFalling
      },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.copy,
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
      src: { value: dpadCenterStrip },
      priority: 200,
      xform: xforms.noop
    }
  ],

  [sets.rightHandTeleporting]: [
    {
      src: {
        value: triggerFalling
      },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.copy,
      priority: 100
    }
  ],

  [sets.cursorHoldingPen]: [
    {
      src: {
        value: triggerRising
      },
      dest: { value: paths.actions.cursor.startDrawing },
      xform: xforms.copy,
      priority: 300
    },
    {
      src: {
        value: triggerFalling
      },
      dest: { value: paths.actions.cursor.stopDrawing },
      xform: xforms.copy,
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
        value: dpadCenterStrip,
        bool: touchpadFalling
      },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.copyIfTrue,
      priority: 300
    },
    {
      src: {
        value: dpadEast,
        bool: touchpadRising
      },
      dest: {
        value: paths.actions.cursor.penPrevColor
      },
      xform: xforms.copyIfTrue,
      priority: 200
    },
    {
      src: {
        value: dpadWest,
        bool: touchpadRising
      },
      dest: {
        value: paths.actions.cursor.penNextColor
      },
      xform: xforms.copyIfTrue,
      priority: 200
    }
  ],

  [sets.cursorHoldingCamera]: [
    {
      src: {
        value: triggerRising
      },
      dest: { value: paths.actions.cursor.takeSnapshot },
      xform: xforms.copy,
      priority: 300
    },
    {
      src: {
        value: triggerFalling
      },
      xform: xforms.noop,
      priority: 300
    },
    {
      src: {
        value: dpadCenterStrip,
        bool: touchpadFalling
      },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.copyIfTrue,
      priority: 300
    }
  ]
});
