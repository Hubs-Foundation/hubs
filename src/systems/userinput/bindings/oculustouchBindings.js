import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";

const leftButton = paths.device.leftOculusTouch.button;
const leftAxis = paths.device.leftOculusTouch.axis;
const leftPose = paths.device.leftOculusTouch.pose;
const rightButton = paths.device.rightOculusTouch.button;
const rightAxis = paths.device.rightOculusTouch.axis;
const rightPose = paths.device.rightOculusTouch.pose;

const scaledLeftJoyHorizontal = "/var/oculustouch/left/scaledJoystickHorizontal";
const scaledLeftJoyVertical = "/var/oculustouch/left/scaledJoystickVertical";
const rightGripFalling = "/var/oculustouch/right/GripFalling";
const rightGripRising = "/var/oculustouch/right/GripRising";
const leftGripFalling = "/var/oculustouch/left/GripFalling";
const leftGripRising = "/var/oculustouch/left/GripRising";
const dpadNorth = "/var/oculustouch/dpad/north";
const dpadSouth = "/var/oculustouch/dpad/south";
const dpadEast = "/var/oculustouch/dpad/east";
const dpadWest = "/var/oculustouch/dpad/west";
const dpadCenter = "/var/oculustouch/dpad/center";
const rightJoystick = "/var/oculustouch/right/joystick";

export const oculustouchBindings = {
  [sets.global]: [
    {
      src: {
        x: rightAxis("joystickHorizontal"),
        y: rightAxis("joystickVertical")
      },
      dest: {
        value: rightJoystick
      },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: rightJoystick
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
        value: dpadEast
      },
      dest: {
        value: paths.actions.snapRotateRight
      },
      xform: xforms.rising
    },
    {
      src: {
        value: dpadWest
      },
      dest: {
        value: paths.actions.snapRotateLeft
      },
      xform: xforms.rising
    },
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
