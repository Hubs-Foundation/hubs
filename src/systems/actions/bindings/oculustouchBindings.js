import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";

const leftButton = paths.device.leftOculusTouch.button;
const leftAxis = paths.device.leftOculusTouch.axis;
//const leftPose = paths.device.leftOculusTouch.pose;
const rightButton = paths.device.rightOculusTouch.button;
//const rightAxis = paths.device.rightOculusTouch.axis;
const rightPose = paths.device.rightOculusTouch.pose;

const scaledLeftJoyHorizontal = "/oculustouch/left/scaledJoystickHorizontal";
const scaledLeftJoyVertical = "/oculustouch/left/scaledJoystickVertical";

const rightGripFalling = "/oculustouch/right/GripFalling";
const rightGripRising = "/oculustouch/right/GripRising";
const leftGripFalling = "/oculustouch/left/GripFalling";
const leftGripRising = "/oculustouch/left/GripRising";

export const oculustouchBindings = {
  [sets.global]: [
    {
      src: {
        value: leftAxis("joystickHorizontal")
      },
      dest: {
        value: scaledLeftJoyHorizontal
      },
      xform: xforms.scale(1.5) // horizontal character speed modifier
    },
    {
      src: {
        value: leftAxis("joystickVertical")
      },
      dest: { value: scaledLeftJoyVertical },
      xform: xforms.scale(-1.5) // vertical character speed modifier
    },
    {
      src: {
        x: scaledLeftJoyHorizontal,
        y: scaledLeftJoyVertical
      },
      dest: { value: paths.actions.characterAcceleration },
      xform: xforms.compose_vec2
    },
    {
      src: { value: rightPose },
      dest: { value: paths.actions.cursorPose },
      xform: xforms.copy
    },
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.rightHandStopTeleport },
      xform: xforms.falling,
      root: rightGripFalling,
      priority: 100
    },
    {
      src: { value: leftButton("grip").pressed },
      dest: { value: paths.actions.leftHandStopTeleport },
      xform: xforms.falling,
      root: leftGripFalling,
      priority: 100
    }
  ],

  [sets.leftHandHoveringOnNothing]: [
    {
      src: { value: leftButton("grip").pressed },
      dest: { value: paths.actions.leftHandStartTeleport },
      xform: xforms.rising,
      root: leftGripRising,
      priority: 100
    }
  ],

  [sets.rightHandHoveringOnNothing]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.rightHandStartTeleport },
      xform: xforms.rising,
      root: rightGripRising,
      priority: 100
    }
  ],

  [sets.cursorHoveringOnNothing]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.rightHandStartTeleport },
      xform: xforms.rising,
      root: rightGripRising,
      priority: 101
    }
  ],

  [sets.leftHandHoveringOnInteractable]: [
    {
      src: { value: leftButton("grip").pressed },
      dest: { value: paths.actions.leftHandGrab },
      xform: xforms.rising,
      root: leftGripRising,
      priority: 200
    }
  ],

  [sets.leftHandHoldingInteractable]: [
    {
      src: { value: leftButton("grip").pressed },
      dest: { value: paths.actions.leftHandDrop },
      xform: xforms.falling,
      root: leftGripFalling,
      priority: 200
    }
  ],

  [sets.cursorHoveringOnInteractable]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.cursorGrab },
      xform: xforms.rising,
      root: rightGripRising,
      priority: 200
    }
  ],

  [sets.cursorHoldingInteractable]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.cursorDrop },
      xform: xforms.falling,
      root: rightGripFalling,
      priority: 200
    }
  ],

  [sets.rightHandHoveringOnInteractable]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.rightHandGrab },
      xform: xforms.rising,
      root: rightGripRising,
      priority: 200
    }
  ],

  [sets.rightHandHoldingInteractable]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.rightHandDrop },
      xform: xforms.falling,
      root: rightGripFalling,
      priority: 200
    }
  ]
};
