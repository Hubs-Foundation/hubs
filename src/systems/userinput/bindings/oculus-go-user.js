import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";

const touchpad = "/vars/oculusgo/touchpad";
const touchpadPressed = "/vars/oculusgo/touchpadPressed";
const dpadNorth = "/vars/oculusgo/dpad/north";
const dpadSouth = "/vars/oculusgo/dpad/south";
const dpadEast = "/vars/oculusgo/dpad/east";
const dpadWest = "/vars/oculusgo/dpad/west";
const dpadCenter = "/vars/oculusgo/dpad/center";
const vec2zero = "/vars/vec2zero";

const triggerRisingRoot = "oculusGoTriggerRising";
const triggerFallingRoot = "oculusGoTriggerFalling";

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
      src: {
        value: paths.device.oculusgo.button("touchpad").pressed
      },
      dest: { value: touchpadPressed },
      xform: xforms.rising
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
      xform: xforms.vec2dpad(0.2)
    },
    {
      src: {
        value: dpadEast,
        bool: touchpadPressed
      },
      dest: {
        value: paths.actions.snapRotateRight
      },
      xform: xforms.copyIfTrue
    },
    {
      src: {
        value: dpadWest,
        bool: touchpadPressed
      },
      dest: {
        value: paths.actions.snapRotateLeft
      },
      xform: xforms.copyIfTrue
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
      dest: { value: vec2zero },
      xform: xforms.always([0, -0.2])
    },
    {
      src: { value: vec2zero },
      dest: { value: paths.actions.cursor.pose },
      xform: xforms.poseFromCameraProjection()
    },
    {
      src: { value: paths.device.oculusgo.pose },
      dest: { value: paths.actions.cursor.pose },
      xform: xforms.copy
    }
  ],

  [sets.cursorHoveringOnInteractable]: [
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising,
      root: triggerRisingRoot,
      priority: 200
    }
  ],

  [sets.cursorHoldingInteractable]: [
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.falling,
      root: triggerFallingRoot,
      priority: 200
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
        value: dpadCenter,
        bool: touchpadPressed
      },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.copyIfTrue
    }
  ]
};
