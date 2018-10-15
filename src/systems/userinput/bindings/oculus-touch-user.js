import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";

const name = "/touch/var/";

const leftButton = paths.device.leftOculusTouch.button;
const leftAxis = paths.device.leftOculusTouch.axis;
const leftPose = paths.device.leftOculusTouch.pose;
const rightButton = paths.device.rightOculusTouch.button;
const rightAxis = paths.device.rightOculusTouch.axis;
const rightPose = paths.device.rightOculusTouch.pose;

const scaledLeftJoyX = `${name}left/scaledJoyX`;
const scaledLeftJoyY = `${name}left/scaledJoyY`;
const rightGripFalling = "${name}right/GripFalling";
const rightTriggerFalling = `${name}right/TriggerFalling`;
const rightGripRising = `${name}right/GripRising`;
const rightTriggerRising = `${name}right/TriggerRising`;
const leftGripFalling = `${name}left/GripFalling`;
const leftGripRising = `${name}left/GripRising`;
const leftTriggerRising = `${name}left/TriggerRising`;
const leftTriggerFalling = `${name}left/TriggerFalling`;
const rightDpadNorth = `${name}rightDpad/north`;
const rightDpadSouth = `${name}rightDpad/south`;
const rightDpadEast = `${name}rightDpad/east`;
const rightDpadWest = `${name}rightDpad/west`;
const rightDpadCenter = `${name}rightDpad/center`;
const rightJoy = `${name}right/joy`;
const leftDpadNorth = `${name}leftDpad/north`;
const leftDpadSouth = `${name}leftDpad/south`;
const leftDpadEast = `${name}leftDpad/east`;
const leftDpadWest = `${name}leftDpad/west`;
const leftDpadCenter = `${name}leftDpad/center`;
const leftJoy = `${name}left/joy`;
const oculusTouchCharacterAcceleration = `${name}characterAcceleration`;
const keyboardCharacterAcceleration = "/var/keyboard/characterAcceleration";

export const oculusTouchUserBindings = {
  [sets.global]: [
    {
      src: {
        x: leftAxis("joyX"),
        y: leftAxis("joyV")
      },
      dest: {
        value: leftJoy
      },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: leftJoy
      },
      dest: {
        north: leftDpadNorth,
        south: leftDpadSouth,
        east: leftDpadEast,
        west: leftDpadWest,
        center: leftDpadCenter
      },
      xform: xforms.vec2dpad(0.2)
    },
    {
      src: {
        x: rightAxis("joyX"),
        y: rightAxis("joyY")
      },
      dest: {
        value: rightJoy
      },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: rightJoy
      },
      dest: {
        north: rightDpadNorth,
        south: rightDpadSouth,
        east: rightDpadEast,
        west: rightDpadWest,
        center: rightDpadCenter
      },
      xform: xforms.vec2dpad(0.2)
    },
    {
      src: {
        value: rightDpadEast
      },
      dest: {
        value: paths.actions.snapRotateRight
      },
      xform: xforms.rising,
      root: rightDpadEast,
      priority: 100
    },
    {
      src: {
        value: rightDpadWest
      },
      dest: {
        value: paths.actions.snapRotateLeft
      },
      xform: xforms.rising,
      root: rightDpadWest,
      priority: 100
    },
    {
      src: {
        value: leftAxis("joyX")
      },
      dest: {
        value: scaledLeftJoyX
      },
      xform: xforms.scale(1.5) // horizontal character speed modifier
    },
    {
      src: {
        value: leftAxis("joyY")
      },
      dest: { value: scaledLeftJoyY },
      xform: xforms.scale(-1.5) // vertical character speed modifier
    },
    {
      src: {
        x: scaledLeftJoyX,
        y: scaledLeftJoyY
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
      src: { value: rightPose },
      dest: { value: paths.actions.rightHand.pose },
      xform: xforms.copy
    },
    {
      src: { value: leftPose },
      dest: { value: paths.actions.leftHand.pose },
      xform: xforms.copy
    },
    {
      src: { value: rightButton("trigger").pressed },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.falling,
      root: rightTriggerFalling,
      priority: 100
    },
    {
      src: { value: leftButton("trigger").pressed },
      dest: { value: paths.actions.leftHand.stopTeleport },
      xform: xforms.falling,
      root: leftTriggerFalling,
      priority: 100
    }
  ],

  [sets.leftHandHoveringOnNothing]: [
    {
      src: { value: leftButton("trigger").pressed },
      dest: { value: paths.actions.leftHand.startTeleport },
      xform: xforms.rising,
      root: leftTriggerRising,
      priority: 100
    }
  ],

  [sets.rightHandHoveringOnNothing]: [],
  [sets.cursorHoveringOnUI]: [
    {
      src: { value: rightButton("trigger").pressed },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising,
      root: rightTriggerRising,
      priority: 100
    }
  ],

  [sets.cursorHoveringOnNothing]: [
    {
      src: { value: rightButton("trigger").pressed },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.rising,
      root: rightTriggerRising,
      priority: 100
    }
  ],

  [sets.leftHandHoveringOnInteractable]: [
    {
      src: { value: leftButton("grip").pressed },
      dest: { value: paths.actions.leftHand.grab },
      xform: xforms.rising,
      root: leftGripRising,
      priority: 200
    },
    {
      src: { value: leftButton("trigger").pressed },
      dest: { value: paths.actions.leftHand.grab },
      xform: xforms.rising,
      root: leftTriggerRising,
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

  [sets.leftHandHoveringOnPen]: [
    {
      src: { value: leftButton("trigger").pressed },
      dest: { value: paths.actions.leftHand.grab },
      xform: xforms.rising,
      root: leftTriggerRising,
      priority: 200
    }
  ],
  [sets.leftHandHoldingPen]: [
    {
      src: { value: leftButton("trigger").pressed },
      dest: { value: paths.actions.leftHand.startDrawing },
      xform: xforms.rising
    },
    {
      src: { value: leftButton("trigger").pressed },
      dest: { value: paths.actions.leftHand.stopDrawing },
      xform: xforms.falling
    },
    {
      src: {
        value: leftDpadEast
      },
      dest: {
        value: paths.actions.leftHand.penNextColor
      },
      xform: xforms.rising,
      root: leftDpadEast,
      priority: 200
    },
    {
      src: {
        value: leftDpadWest
      },
      dest: {
        value: paths.actions.leftHand.penPrevColor
      },
      xform: xforms.rising,
      root: leftDpadWest,
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
    },
    {
      src: { value: rightButton("trigger").pressed },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising,
      root: rightTriggerRising,
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
    },
    {
      src: { value: rightAxis("joyY") },
      dest: { value: paths.actions.cursor.modDelta },
      xform: xforms.copy
    }
  ],

  [sets.cursorHoveringOnPen]: [],

  [sets.cursorHoldingPen]: [
    {
      src: { value: rightButton("trigger").pressed },
      dest: { value: paths.actions.cursor.startDrawing },
      xform: xforms.rising
    },
    {
      src: { value: rightButton("trigger").pressed },
      dest: { value: paths.actions.cursor.stopDrawing },
      xform: xforms.falling
    }
  ],

  [sets.rightHandHoveringOnInteractable]: [
    {
      src: { value: rightButton("grip").pressed },
      dest: { value: paths.actions.rightHand.grab },
      xform: xforms.rising,
      root: rightGripRising,
      priority: 200
    },
    {
      src: { value: rightButton("trigger").pressed },
      dest: { value: paths.actions.rightHand.grab },
      xform: xforms.rising,
      root: rightTriggerRising,
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
  ],
  [sets.rightHandHoveringOnPen]: [
    {
      src: { value: rightButton("trigger").pressed },
      dest: { value: paths.actions.rightHand.grab },
      xform: xforms.rising,
      root: rightTriggerRising,
      priority: 300
    }
  ],
  [sets.rightHandHoldingPen]: [
    {
      src: { value: rightButton("trigger").pressed },
      dest: { value: paths.actions.rightHand.startDrawing },
      xform: xforms.rising
    },
    {
      src: { value: rightButton("trigger").pressed },
      dest: { value: paths.actions.rightHand.stopDrawing },
      xform: xforms.falling
    },
    {
      src: {
        value: rightDpadEast
      },
      dest: {
        value: paths.actions.rightHand.penNextColor
      },
      xform: xforms.rising,
      root: rightDpadEast,
      priority: 200
    },
    {
      src: {
        value: rightDpadWest
      },
      dest: {
        value: paths.actions.rightHand.penPrevColor
      },
      xform: xforms.rising,
      root: rightDpadWest,
      priority: 200
    }
  ]
};
