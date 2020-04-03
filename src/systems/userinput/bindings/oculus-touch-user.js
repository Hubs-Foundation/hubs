import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

const name = "/touch/var/";

const leftButton = paths.device.leftOculusTouch.button;
const leftAxis = paths.device.leftOculusTouch.axis;
const leftPose = paths.device.leftOculusTouch.pose;
const rightButton = paths.device.rightOculusTouch.button;
const rightAxis = paths.device.rightOculusTouch.axis;
const rightPose = paths.device.rightOculusTouch.pose;

const wakeLeft = `${name}left/wake`;
const wakeRight = `${name}right/wake`;
const leftJoyXDeadzoned = `${name}left/joy/x/deadzoned`;
const leftJoyYDeadzoned = `${name}left/joy/y/deadzoned`;
const scaledLeftJoyX = `${name}left/scaledJoyX`;
const scaledLeftJoyY = `${name}left/scaledJoyY`;
const cursorDrop2 = `${name}right/cursorDrop2`;
const cursorDrop1 = `${name}right/cursorDrop1`;
const leftCursorDrop2 = `${name}left/cursorDrop2`;
const leftCursorDrop1 = `${name}left/cursorDrop1`;
const rightHandDrop2 = `${name}right/rightHandDrop2`;
const rightGripRisingGrab = `${name}right/grip/RisingGrab`;
const rightTriggerRisingGrab = `${name}right/trigger/RisingGrab`;
const leftGripRisingGrab = `${name}left/grip/RisingGrab`;
const leftTriggerRisingGrab = `${name}left/trigger/RisingGrab`;
const rightDpadNorth = `${name}rightDpad/north`;
const rightDpadSouth = `${name}rightDpad/south`;
const rightDpadEast = `${name}rightDpad/east`;
const rightDpadWest = `${name}rightDpad/west`;
const rightDpadCenter = `${name}rightDpad/center`;
const rightJoy = `${name}right/joy`;
const rightJoyY1 = `${name}right/joyY1`;
const rightJoyY2 = `${name}right/joyY2`;
const rightJoyYDeadzoned = `${name}right/joy/y/deadzoned`;
const leftDpadNorth = `${name}leftDpad/north`;
const leftDpadSouth = `${name}leftDpad/south`;
const leftDpadEast = `${name}leftDpad/east`;
const leftDpadWest = `${name}leftDpad/west`;
const leftDpadCenter = `${name}leftDpad/center`;
const leftJoy = `${name}left/joy`;
const oculusTouchCharacterAcceleration = `${name}characterAcceleration`;
const keyboardCharacterAcceleration = "/var/keyboard/characterAcceleration";
const characterAcceleration = "/var/oculus-touch/nonNormalizedCharacterAcceleration";
const wasd_vec2 = "/var/keyboard/wasd_vec2";
const arrows_vec2 = "/var/keyboard/arrows_vec2";
const keyboardBoost = "/var/keyboard-oculus/boost";
const rightBoost = "/var/right-oculus/boost";
const leftBoost = "/var/left-oculus/boost";
const rightTouchSnapRight = `${name}/right/snap-right`;
const rightTouchSnapLeft = `${name}/right/snap-left`;
const keyboardSnapRight = `${name}/keyboard/snap-right`;
const keyboardSnapLeft = `${name}/keyboard/snap-left`;

const lowerButtons = `${name}buttons/lower`;
const upperButtons = `${name}buttons/upper`;

const ensureFrozenViaButtons = `${name}buttons/ensureFrozen`;
const ensureFrozenViaKeyboard = `${name}keyboard/ensureFrozen`;

const thawViaButtons = `${name}buttons/thaw`;
const thawViaKeyboard = `${name}keyboard/thaw`;

const v = s => {
  return "/oculus-touch-user-vars/" + s;
};
const leftGripPressed1 = v("leftGripPressed1");
const leftGripPressed2 = v("leftGripPressed2");
const rightGripPressed1 = v("rightGripPressed1");
const rightGripPressed2 = v("rightGripPressed2");
const leftTriggerPressed1 = v("leftTriggerPressed1");
const leftTriggerPressed2 = v("leftTriggerPressed2");
const rightTriggerPressed1 = v("rightTriggerPressed1");
const rightTriggerPressed2 = v("rightTriggerPressed2");

export const oculusTouchUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: {
        value: paths.device.leftOculusTouch.matrix
      },
      dest: {
        value: paths.actions.leftHand.matrix
      },
      xform: xforms.copy
    },
    {
      src: {
        value: paths.device.rightOculusTouch.matrix
      },
      dest: {
        value: paths.actions.rightHand.matrix
      },
      xform: xforms.copy
    },
    {
      src: [ensureFrozenViaButtons, ensureFrozenViaKeyboard],
      dest: { value: paths.actions.ensureFrozen },
      xform: xforms.any
    },
    {
      src: [thawViaButtons, thawViaKeyboard],
      dest: { value: paths.actions.thaw },
      xform: xforms.any
    },
    {
      src: {
        value: leftButton("grip").pressed
      },
      dest: {
        value: leftGripPressed1
      },
      xform: xforms.copy
    },
    {
      src: {
        value: leftButton("grip").pressed
      },
      dest: {
        value: leftGripPressed2
      },
      xform: xforms.copy
    },
    {
      src: {
        value: leftGripPressed1
      },
      dest: {
        value: paths.actions.leftHand.middleRingPinky
      },
      xform: xforms.copy
    },
    {
      src: [leftButton("x").touched, leftButton("y").touched, leftButton("thumbStick").touched],
      dest: {
        value: paths.actions.leftHand.thumb
      },
      xform: xforms.any
    },
    {
      src: { value: leftButton("trigger").pressed },
      dest: {
        value: leftTriggerPressed1
      },
      xform: xforms.copy
    },
    {
      src: { value: leftButton("trigger").pressed },
      dest: {
        value: leftTriggerPressed2
      },
      xform: xforms.copy
    },
    {
      src: { value: leftTriggerPressed1 },
      dest: {
        value: paths.actions.leftHand.index
      },
      xform: xforms.copy
    },
    {
      src: {
        value: rightButton("grip").pressed
      },
      dest: {
        value: rightGripPressed1
      },
      xform: xforms.copy
    },
    {
      src: {
        value: rightButton("grip").pressed
      },
      dest: {
        value: rightGripPressed2
      },
      xform: xforms.copy
    },
    {
      src: {
        value: rightGripPressed1
      },
      dest: {
        value: paths.actions.rightHand.middleRingPinky
      },
      xform: xforms.copy
    },
    {
      src: [rightButton("a").touched, rightButton("b").touched, rightButton("thumbStick").touched],
      dest: {
        value: paths.actions.rightHand.thumb
      },
      xform: xforms.any
    },
    {
      src: { value: rightButton("trigger").pressed },
      dest: {
        value: rightTriggerPressed1
      },
      xform: xforms.copy
    },
    {
      src: { value: rightButton("trigger").pressed },
      dest: {
        value: rightTriggerPressed2
      },
      xform: xforms.copy
    },
    {
      src: { value: rightTriggerPressed1 },
      dest: {
        value: paths.actions.rightHand.index
      },
      xform: xforms.copy
    },
    {
      src: {
        x: leftAxis("joyX"),
        y: leftAxis("joyY")
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
      xform: xforms.vec2dpad(0.2, false, true)
    },
    {
      src: {
        value: rightAxis("joyY")
      },
      dest: { value: rightJoyY1 },
      xform: xforms.copy
    },
    {
      src: {
        value: rightAxis("joyY")
      },
      dest: { value: rightJoyY2 },
      xform: xforms.copy
    },
    {
      src: {
        x: rightAxis("joyX"),
        y: rightJoyY1
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
      xform: xforms.vec2dpad(0.2, false, true)
    },
    {
      src: {
        value: rightDpadEast
      },
      dest: {
        value: rightTouchSnapRight
      },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: { value: paths.device.keyboard.key("e") },
      dest: { value: keyboardSnapRight },
      xform: xforms.rising
    },
    {
      src: [rightTouchSnapRight, keyboardSnapRight],
      dest: { value: paths.actions.snapRotateRight },
      xform: xforms.any
    },
    {
      src: { value: paths.device.keyboard.key("Tab") },
      dest: { value: paths.actions.toggleFreeze },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.keyboard.key(" ") },
      dest: { value: ensureFrozenViaKeyboard },
      xform: xforms.copy
    },
    {
      src: [leftButton("x").pressed, rightButton("a").pressed],
      dest: { value: lowerButtons },
      xform: xforms.any
    },
    {
      src: [leftButton("y").pressed, rightButton("b").pressed],
      dest: { value: upperButtons },
      xform: xforms.any
    },
    {
      src: { value: lowerButtons },
      dest: { value: ensureFrozenViaButtons },
      xform: xforms.copy
    },
    {
      src: { value: lowerButtons },
      dest: { value: thawViaButtons },
      xform: xforms.falling
    },
    {
      src: { value: paths.device.keyboard.key(" ") },
      dest: { value: thawViaKeyboard },
      xform: xforms.falling
    },
    {
      src: {
        value: rightDpadWest
      },
      dest: {
        value: rightTouchSnapLeft
      },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: { value: paths.device.keyboard.key("q") },
      dest: { value: keyboardSnapLeft },
      xform: xforms.rising
    },
    {
      src: [rightTouchSnapLeft, keyboardSnapLeft],
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.any
    },
    {
      src: {
        value: leftAxis("joyY")
      },
      dest: {
        value: leftJoyYDeadzoned
      },
      xform: xforms.deadzone(0.1)
    },
    {
      src: {
        value: leftJoyYDeadzoned
      },
      dest: {
        value: scaledLeftJoyY
      },
      xform: xforms.scale(-1.5) // horizontal character speed modifier
    },
    {
      src: {
        value: leftAxis("joyX")
      },
      dest: {
        value: leftJoyXDeadzoned
      },
      xform: xforms.deadzone(0.1)
    },
    {
      src: {
        value: leftJoyXDeadzoned
      },
      dest: {
        value: scaledLeftJoyX
      },
      xform: xforms.scale(1.5) // horizontal character speed modifier
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
        w: paths.device.keyboard.key("arrowup"),
        a: paths.device.keyboard.key("arrowleft"),
        s: paths.device.keyboard.key("arrowdown"),
        d: paths.device.keyboard.key("arrowright")
      },
      dest: { vec2: arrows_vec2 },
      xform: xforms.wasd_to_vec2
    },
    {
      src: {
        w: paths.device.keyboard.key("w"),
        a: paths.device.keyboard.key("a"),
        s: paths.device.keyboard.key("s"),
        d: paths.device.keyboard.key("d")
      },
      dest: { vec2: wasd_vec2 },
      xform: xforms.wasd_to_vec2
    },
    {
      src: {
        first: wasd_vec2,
        second: arrows_vec2
      },
      dest: { value: keyboardCharacterAcceleration },
      xform: xforms.max_vec2
    },
    {
      src: {
        first: oculusTouchCharacterAcceleration,
        second: keyboardCharacterAcceleration
      },
      dest: {
        value: characterAcceleration
      },
      xform: xforms.max_vec2
    },
    {
      src: {
        value: characterAcceleration,
        override: "/device/overrides/foo"
      },
      dest: { value: paths.actions.characterAcceleration },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.keyboard.key("shift") },
      dest: { value: keyboardBoost },
      xform: xforms.copy
    },
    {
      src: {
        value: leftButton("y").pressed
      },
      dest: {
        value: leftBoost
      },
      xform: xforms.copy
    },
    {
      src: {
        value: rightButton("b").pressed
      },
      dest: {
        value: rightBoost
      },
      xform: xforms.copy
    },
    {
      src: {
        value: leftButton("thumbStick").pressed
      },
      dest: {
        value: paths.actions.nextCameraMode
      },
      xform: xforms.rising
    },
    {
      src: {
        value: rightButton("thumbStick").pressed
      },
      dest: {
        value: paths.actions.toggleFly
      },
      xform: xforms.rising
    },
    {
      src: [keyboardBoost, leftBoost, rightBoost],
      dest: { value: paths.actions.boost },
      xform: xforms.any
    },
    {
      src: {
        value: paths.device.keyboard.key("t")
      },
      dest: {
        value: paths.actions.focusChat
      },
      xform: xforms.rising
    },
    {
      src: {
        value: paths.device.keyboard.key("/")
      },
      dest: {
        value: paths.actions.focusChatCommand
      },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.keyboard.key("Escape") },
      dest: { value: paths.actions.mediaExit },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.keyboard.key("p") },
      dest: { value: paths.actions.spawnPen },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.keyboard.key("c") },
      dest: { value: paths.actions.toggleCamera },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.keyboard.key("x") },
      dest: { value: paths.actions.takeSnapshot },
      xform: xforms.copy
    },
    {
      src: {
        bool: paths.device.keyboard.key("control"),
        value: paths.device.keyboard.key("1")
      },
      dest: { value: "/var/shift+1" },
      priority: 1001,
      xform: xforms.copyIfTrue
    },
    {
      src: { value: "/var/shift+1" },
      dest: { value: paths.actions.mediaSearch1 },
      xform: xforms.rising
    },
    {
      src: {
        bool: paths.device.keyboard.key("control"),
        value: paths.device.keyboard.key("2")
      },
      dest: { value: "/var/shift+2" },
      priority: 1001,
      xform: xforms.copyIfTrue
    },
    {
      src: { value: "/var/shift+2" },
      dest: { value: paths.actions.mediaSearch2 },
      xform: xforms.rising
    },
    {
      src: {
        bool: paths.device.keyboard.key("control"),
        value: paths.device.keyboard.key("3")
      },
      dest: { value: "/var/shift+3" },
      priority: 1001,
      xform: xforms.copyIfTrue
    },
    {
      src: { value: "/var/shift+3" },
      dest: { value: paths.actions.mediaSearch3 },
      xform: xforms.rising
    },
    {
      src: {
        bool: paths.device.keyboard.key("control"),
        value: paths.device.keyboard.key("4")
      },
      dest: { value: "/var/shift+4" },
      priority: 1001,
      xform: xforms.copyIfTrue
    },
    {
      src: { value: "/var/shift+4" },
      dest: { value: paths.actions.mediaSearch4 },
      xform: xforms.rising
    },
    {
      src: {
        bool: paths.device.keyboard.key("control"),
        value: paths.device.keyboard.key("5")
      },
      dest: { value: "/var/shift+5" },
      priority: 1001,
      xform: xforms.copyIfTrue
    },
    {
      src: { value: "/var/shift+5" },
      dest: { value: paths.actions.mediaSearch5 },
      xform: xforms.rising
    },
    {
      src: {
        bool: paths.device.keyboard.key("control"),
        value: paths.device.keyboard.key("6")
      },
      dest: { value: "/var/shift+6" },
      priority: 1001,
      xform: xforms.copyIfTrue
    },
    {
      src: { value: "/var/shift+6" },
      dest: { value: paths.actions.mediaSearch6 },
      xform: xforms.rising
    },
    {
      src: {
        bool: paths.device.keyboard.key("control"),
        value: paths.device.keyboard.key("7")
      },
      dest: { value: "/var/shift+7" },
      priority: 1001,
      xform: xforms.copyIfTrue
    },
    {
      src: { value: "/var/shift+7" },
      dest: { value: paths.actions.mediaSearch7 },
      xform: xforms.rising
    },
    {
      src: {
        bool: paths.device.keyboard.key("control"),
        value: paths.device.keyboard.key("8")
      },
      dest: { value: "/var/shift+8" },
      priority: 1001,
      xform: xforms.copyIfTrue
    },
    {
      src: { value: "/var/shift+8" },
      dest: { value: paths.actions.mediaSearch8 },
      xform: xforms.rising
    },
    {
      src: {
        value: paths.device.keyboard.key("l")
      },
      dest: {
        value: paths.actions.logDebugFrame
      },
      xform: xforms.rising
    },
    {
      src: {
        value: paths.device.keyboard.key("k")
      },
      dest: {
        value: paths.actions.logInteractionState
      },
      xform: xforms.rising
    },
    {
      src: {
        value: paths.device.keyboard.key("m")
      },
      dest: {
        value: paths.actions.muteMic
      },
      xform: xforms.rising
    },
    {
      src: { value: leftPose },
      dest: { value: paths.actions.cursor.left.pose },
      xform: xforms.copy
    },
    {
      src: { value: rightPose },
      dest: { value: paths.actions.cursor.right.pose },
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
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.stopTeleport },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: [
        leftButton("y").pressed,
        leftButton("x").pressed,
        leftButton("trigger").pressed,
        leftButton("grip").pressed
      ],
      dest: { value: wakeLeft },
      xform: xforms.any
    },
    {
      src: { value: wakeLeft },
      dest: { value: paths.actions.cursor.left.wake },
      xform: xforms.rising
    },
    {
      src: [
        rightButton("b").pressed,
        rightButton("a").pressed,
        rightButton("trigger").pressed,
        rightButton("grip").pressed
      ],
      dest: { value: wakeRight },
      xform: xforms.any
    },
    {
      src: { value: wakeRight },
      dest: { value: paths.actions.cursor.right.wake },
      xform: xforms.rising
    }
  ],

  [sets.leftHandHoveringOnNothing]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.startTeleport },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.rightCursorHoveringOnUI]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.right.grab },
      xform: xforms.rising,
      priority: 2
    }
  ],

  [sets.leftCursorHoveringOnUI]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.cursor.left.grab },
      xform: xforms.rising,
      priority: 2
    }
  ],

  [sets.rightCursorHoveringOnVideo]: [
    {
      src: { value: rightAxis("joyY") },
      dest: { value: paths.actions.cursor.right.mediaVolumeMod },
      xform: xforms.scale(-0.01)
    }
  ],

  [sets.leftCursorHoveringOnVideo]: [
    {
      src: { value: leftAxis("joyY") },
      dest: { value: paths.actions.cursor.left.mediaVolumeMod },
      xform: xforms.scale(-0.01)
    }
  ],

  [sets.rightCursorHoveringOnNothing]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.leftCursorHoveringOnNothing]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.startTeleport },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.leftHandHoveringOnInteractable]: [
    {
      src: { value: leftGripPressed2 },
      dest: { value: leftGripRisingGrab },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: [leftGripRisingGrab],
      dest: { value: paths.actions.leftHand.grab },
      xform: xforms.any,
      priority: 2
    },
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.stopTeleport },
      xform: xforms.falling,
      priority: 2
    }
  ],

  [sets.inspecting]: [
    {
      src: { value: upperButtons },
      dest: { value: paths.actions.stopInspecting },
      xform: xforms.falling
    }
  ],

  [sets.leftHandHoldingInteractable]: [
    {
      src: { value: leftGripPressed2 },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.falling
    }
  ],

  [sets.leftHandHoveringOnPen]: [],
  [sets.leftHandHoldingPen]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.startDrawing },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.stopDrawing },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: {
        value: leftDpadEast,
        override: "/device/overrides/foo"
      },
      dest: {
        value: paths.actions.leftHand.penNextColor
      },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: {
        value: leftDpadWest,
        override: "/device/overrides/foo"
      },
      dest: {
        value: paths.actions.leftHand.penPrevColor
      },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: { value: leftJoyYDeadzoned },
      dest: { value: paths.actions.leftHand.scalePenTip },
      xform: xforms.scaleExp(-0.005, 5),
      priority: 1
    },
    {
      src: { value: leftButton("y").pressed },
      dest: { value: paths.actions.leftHand.switchDrawMode },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: { value: leftButton("x").pressed },
      dest: { value: paths.actions.leftHand.undoDrawing },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.rightCursorHoveringOnInteractable]: [
    {
      src: { value: rightGripPressed2 },
      dest: { value: rightGripRisingGrab },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: rightTriggerRisingGrab },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: [rightGripRisingGrab],
      dest: { value: paths.actions.cursor.right.grab },
      xform: xforms.any,
      priority: 2
    },
    {
      src: { value: upperButtons },
      dest: { value: paths.actions.startInspecting },
      xform: xforms.rising
    }
  ],

  [sets.leftCursorHoveringOnInteractable]: [
    {
      src: { value: leftGripPressed2 },
      dest: { value: leftGripRisingGrab },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: leftTriggerRisingGrab },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: [leftGripRisingGrab],
      dest: { value: paths.actions.cursor.left.grab },
      xform: xforms.any,
      priority: 2
    },
    {
      src: { value: upperButtons },
      dest: { value: paths.actions.startInspecting },
      xform: xforms.rising
    }
  ],

  [sets.rightCursorHoldingUI]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: cursorDrop2 },
      xform: xforms.falling,
      priority: 5
    }
  ],
  [sets.leftCursorHoldingUI]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: leftCursorDrop2 },
      xform: xforms.falling,
      priority: 5
    }
  ],

  [sets.rightCursorHoldingInteractable]: [
    {
      src: { value: rightAxis("joyY") },
      dest: { value: paths.actions.cursor.right.modDelta },
      xform: xforms.scale(0.1)
    },
    {
      src: { value: rightGripPressed2 },
      dest: { value: cursorDrop1 },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: [cursorDrop1, cursorDrop2],
      dest: { value: paths.actions.cursor.right.drop },
      xform: xforms.any,
      priority: 2
    }
  ],

  [sets.leftCursorHoldingInteractable]: [
    {
      src: { value: leftAxis("joyY") },
      dest: { value: paths.actions.cursor.left.modDelta },
      xform: xforms.scale(0.1)
    },
    {
      src: { value: leftGripPressed2 },
      dest: { value: leftCursorDrop1 },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: [leftCursorDrop1, leftCursorDrop2],
      dest: { value: paths.actions.cursor.left.drop },
      xform: xforms.any,
      priority: 2
    }
  ],

  [sets.rightCursorHoveringOnPen]: [],

  [sets.rightCursorHoldingPen]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.right.startDrawing },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.right.stopDrawing },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: { value: rightButton("b").pressed },
      dest: { value: paths.actions.cursor.right.undoDrawing },
      xform: xforms.rising,
      priority: 1
    }
  ],
  [sets.leftCursorHoldingPen]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.cursor.left.startDrawing },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.cursor.left.stopDrawing },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: { value: leftButton("y").pressed },
      dest: { value: paths.actions.cursor.left.undoDrawing },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.rightHandHoveringOnInteractable]: [
    {
      src: { value: rightGripPressed2 },
      dest: { value: rightGripRisingGrab },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: [rightGripRisingGrab],
      dest: { value: paths.actions.rightHand.grab },
      xform: xforms.any,
      priority: 2
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.falling,
      priority: 2
    }
  ],

  [sets.rightHandHoldingInteractable]: [
    {
      src: { value: rightGripPressed2 },
      dest: {
        value: rightHandDrop2
      },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: [rightHandDrop2],
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.any,
      priority: 2
    }
  ],
  [sets.rightHandHoveringOnPen]: [],
  [sets.rightHandHoldingPen]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.startDrawing },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.stopDrawing },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: {
        value: rightDpadEast
      },
      dest: {
        value: paths.actions.rightHand.penNextColor
      },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: {
        value: rightDpadWest
      },
      dest: {
        value: paths.actions.rightHand.penPrevColor
      },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: {
        value: rightAxis("joyY")
      },
      dest: {
        value: rightJoyYDeadzoned
      },
      xform: xforms.deadzone(0.1)
    },
    {
      src: { value: rightJoyYDeadzoned },
      dest: { value: paths.actions.rightHand.scalePenTip },
      xform: xforms.scaleExp(-0.005, 5),
      priority: 2
    },
    {
      src: { value: rightGripPressed2 },
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: { value: rightButton("b").pressed },
      dest: { value: paths.actions.rightHand.switchDrawMode },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: { value: rightButton("a").pressed },
      dest: { value: paths.actions.rightHand.undoDrawing },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.rightCursorHoveringOnCamera]: [],
  [sets.rightHandHoveringOnCamera]: [],
  [sets.leftHandHoveringOnCamera]: [],

  [sets.rightHandHoldingCamera]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.takeSnapshot },
      xform: xforms.copy,
      priority: 4
    }
  ],
  [sets.leftHandHoldingCamera]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.takeSnapshot },
      xform: xforms.copy,
      priority: 4
    }
  ],
  [sets.rightCursorHoldingCamera]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.right.takeSnapshot },
      xform: xforms.copy,
      priority: 4
    }
  ],
  [sets.leftCursorHoldingCamera]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.cursor.left.takeSnapshot },
      xform: xforms.copy,
      priority: 4
    }
  ],

  [sets.rightHandHoveringOnNothing]: [],
  [sets.inputFocused]: [
    {
      src: { value: "/device/keyboard" },
      dest: { value: paths.noop },
      xform: xforms.noop,
      priority: 1000
    }
  ]
});
