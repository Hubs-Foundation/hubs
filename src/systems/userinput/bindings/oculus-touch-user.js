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
const oculusTouchCharacterAcceleration = "/var/oculustouch/characterAcceleration";
const keyboardCharacterAcceleration = "/var/keyboard/characterAcceleration";

export const oculusTouchUserBindings = {
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
    //    {
    //      src: {
    //        value: rightJoystick
    //      },
    //      dest: {
    //        north: dpadNorth,
    //        south: dpadSouth,
    //        east: dpadEast,
    //        west: dpadWest,
    //        center: dpadCenter
    //      },
    //      xform: xforms.vec2dpad(0.2)
    //    },
    //    {
    //      src: {
    //        value: dpadEast
    //      },
    //      dest: {
    //        value: paths.actions.snapRotateRight
    //      },
    //      xform: xforms.rising
    //    },
    //    {
    //      src: {
    //        value: dpadWest
    //      },
    //      dest: {
    //        value: paths.actions.snapRotateLeft
    //      },
    //      xform: xforms.rising
    //    },
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
      dest: { value: oculusTouchCharacterAcceleration },
      xform: xforms.compose_vec2
    },
    {
      src: {
        w: paths.device.keyboard.key("w"),
        a: paths.device.keyboard.key("a"),
        s: paths.device.keyboard.key("s"),
        d: paths.device.keyboard.key("d")
      },
      dest: { vec2: keyboardCharacterAcceleration },
      xform: xforms.wasd_to_vec2
    },
    {
      src: {
        first: oculusTouchCharacterAcceleration,
        second: keyboardCharacterAcceleration
      },
      dest: {
        value: paths.actions.characterAcceleration
      },
      xform: xforms.add_vec2
    },
    {
      src: { value: rightPose },
      dest: { value: paths.actions.cursor.pose },
      xform: xforms.copy
    },
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.falling,
      root: rightGripFalling,
      priority: 100
    },
    {
      src: { value: leftButton("grip").pressed },
      dest: { value: paths.actions.leftHand.stopTeleport },
      xform: xforms.falling,
      root: leftGripFalling,
      priority: 100
    }
  ],

  [sets.leftHandHoveringOnNothing]: [
    {
      src: { value: leftButton("grip").pressed },
      dest: { value: paths.actions.leftHand.startTeleport },
      xform: xforms.rising,
      root: leftGripRising,
      priority: 100
    }
  ],

  [sets.rightHandHoveringOnNothing]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.rising,
      root: rightGripRising,
      priority: 100
    }
  ],

  [sets.cursorHoveringOnNothing]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.rising,
      root: rightGripRising,
      priority: 101
    }
  ],

  [sets.leftHandHoveringOnInteractable]: [
    {
      src: { value: leftButton("grip").pressed },
      dest: { value: paths.actions.leftHand.grab },
      xform: xforms.rising,
      root: leftGripRising,
      priority: 200
    }
  ],

  [sets.leftHandHoldingInteractable]: [
    {
      src: { value: leftButton("grip").pressed },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.falling,
      root: leftGripFalling,
      priority: 200
    }
  ],

  [sets.cursorHoveringOnInteractable]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising,
      root: rightGripRising,
      priority: 200
    }
  ],

  [sets.cursorHoldingInteractable]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.falling,
      root: rightGripFalling,
      priority: 200
    }
  ],

  [sets.rightHandHoveringOnInteractable]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.rightHand.grab },
      xform: xforms.rising,
      root: rightGripRising,
      priority: 200
    }
  ],

  [sets.rightHandHoldingInteractable]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.falling,
      root: rightGripFalling,
      priority: 200
    }
  ]
};
