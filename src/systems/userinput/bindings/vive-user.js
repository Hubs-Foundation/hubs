import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

const v = name => {
  return `/vive-user/vive-var/${name}`;
};

const lButton = paths.device.vive.left.button;
const lAxis = paths.device.vive.left.axis;
const lPose = paths.device.vive.left.pose;
const lJoy = v("left/joy");
const lJoyScaled = v("left/joy/scaled");
const lJoyXScaled = v("left/joyX/scaled");
const lJoyYScaled = v("left/joyY/scaled");
const lDpadNorth = v("left/dpad/north");
const lDpadSouth = v("left/dpad/south");
const lDpadEast = v("left/dpad/east");
const lDpadWest = v("left/dpad/west");
const lDpadCenter = v("left/dpad/center");
const lTriggerFallingStopDrawing = v("left/trigger/falling/stopDrawing");
const lGripFallingStopDrawing = v("left/grip/falling/stopDrawing");
const lTriggerRisingGrab = v("left/trigger/rising/grab");
const lGripRisingGrab = v("left/grab/rising/grab");
const lTouchpadRising2 = v("left/touchpad/rising2");
const lTouchpadRising1 = v("left/touchpad/rising1");
const lCharacterAcceleration = v("left/characterAcceleration");
const characterAcceleration = v("nonNormalizedCharacterAcceleration");
const leftBoost = v("left/boost");

const rButton = paths.device.vive.right.button;
const rAxis = paths.device.vive.right.axis;
const rPose = paths.device.vive.right.pose;
const rJoy = v("right/joy");
const rDpadNorth = v("right/dpad/north");
const rDpadSouth = v("right/dpad/south");
const rDpadEast = v("right/dpad/east");
const rDpadWest = v("right/dpad/west");
const rDpadCenter = v("right/dpad/center");
const rDpadCenterStrip = v("right/dpad/centerStrip");
const rTouchpadRising = v("right/touchpad/rising");
const rTouchpadFalling = v("right/touchpad/falling");
const rightBoost = v("right/boost");
const rTriggerRisingGrab = v("right/trigger/rising/grab");
const rGripRisingGrab = v("right/grab/rising/grab");
const cursorDrop1 = v("right/cursorDrop1");
const cursorDrop2 = v("right/cursorDrop2");
const rHandDrop1 = v("right/drop1");
const rHandDrop2 = v("right/drop2");
const rTriggerStopTeleport = v("right/trigger/stopTeleport");
const rTouchpadStopTeleport = v("right/touchpad/stopTeleport");
const rootForFrozenOverrideWhenHolding = "rootForFrozenOverrideWhenHolding";

const ensureFrozenViaDpad = v("dpad/ensureFrozen");
const ensureFrozenViaKeyboard = v("keyboard/ensureFrozen");

const thawViaDpad = v("dpad/thaw");
const thawViaKeyboard = v("keyboard/thaw");

const rSnapRight = v("right/snap-right");
const rSnapLeft = v("right/snap-left");

const k = name => {
  return `/vive-user/keyboard-var/${name}`;
};
const keyboardSnapRight = k("snap-right");
const keyboardSnapLeft = k("snap-left");
const keyboardCharacterAcceleration = k("characterAcceleration");
const wasd_vec2 = k("wasd_vec2");
const arrows_vec2 = k("arrows_vec2");
const keyboardBoost = k("boost");

const leftGripPressed1 = v("leftGripPressed1");
const leftGripPressed2 = v("leftGripPressed2");
const rightGripPressed1 = v("rightGripPressed1");
const rightGripPressed2 = v("rightGripPressed2");
const leftTriggerPressed1 = v("leftTriggerPressed1");
const leftTriggerPressed2 = v("leftTriggerPressed2");
const leftTouchpadPressed1 = v("leftTouchpadPressed1");
const leftTouchpadPressed2 = v("leftTouchpadPressed2");
const rightTriggerPressed1 = v("rightTriggerPressed1");
const rightTriggerPressed2 = v("rightTriggerPressed2");
const leftTouchpadFallingStopTeleport = v("leftTouchpadFallingStopTeleport");
const leftTriggerFallingStopTeleport = v("leftTriggerFallingStopTeleport");
const leftGripFallingWhileHoldingPen = v("leftGripFallingWhileHoldingPen");

export const viveUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: {
        value: paths.device.vive.left.matrix
      },
      dest: {
        value: paths.actions.leftHand.matrix
      },
      xform: xforms.copy
    },
    {
      src: {
        value: paths.device.vive.right.matrix
      },
      dest: {
        value: paths.actions.rightHand.matrix
      },
      xform: xforms.copy
    },
    {
      src: [ensureFrozenViaDpad, ensureFrozenViaKeyboard],
      dest: { value: paths.actions.ensureFrozen },
      xform: xforms.any
    },
    {
      src: [thawViaDpad, thawViaKeyboard],
      dest: { value: paths.actions.thaw },
      xform: xforms.any
    },
    {
      src: {
        value: lButton("grip").pressed
      },
      dest: {
        value: leftGripPressed1
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
      src: {
        value: lButton("grip").pressed
      },
      dest: {
        value: leftGripPressed2
      },
      xform: xforms.copy
    },
    {
      src: [lButton("touchpad").touched, lButton("top").touched],
      dest: {
        value: paths.actions.leftHand.thumb
      },
      xform: xforms.any
    },
    {
      src: { value: leftTriggerPressed1 },
      dest: {
        value: paths.actions.leftHand.index
      },
      xform: xforms.copy
    },
    {
      src: { value: lButton("trigger").pressed },
      dest: {
        value: leftTriggerPressed1
      },
      xform: xforms.copy
    },
    {
      src: { value: lButton("trigger").pressed },
      dest: {
        value: leftTriggerPressed2
      },
      xform: xforms.copy
    },
    {
      src: {
        value: rButton("grip").pressed
      },
      dest: {
        value: rightGripPressed1
      },
      xform: xforms.copy
    },
    {
      src: {
        value: rButton("grip").pressed
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
      src: [rButton("touchpad").touched, rButton("top").touched],
      dest: {
        value: paths.actions.rightHand.thumb
      },
      xform: xforms.any
    },
    {
      src: {
        value: rButton("trigger").pressed
      },
      dest: { value: rightTriggerPressed1 },
      xform: xforms.copy
    },
    {
      src: {
        value: rButton("trigger").pressed
      },
      dest: { value: rightTriggerPressed2 },
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
        x: lAxis("joyX"),
        y: lAxis("joyY")
      },
      dest: {
        value: lJoy
      },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: lJoy
      },
      dest: {
        north: lDpadNorth,
        south: lDpadSouth,
        east: lDpadEast,
        west: lDpadWest,
        center: lDpadCenter
      },
      xform: xforms.vec2dpad(0.35)
    },
    {
      src: {
        value: lButton("touchpad").pressed
      },
      dest: {
        value: leftTouchpadPressed1
      },
      xform: xforms.copy
    },
    {
      src: {
        value: lButton("touchpad").pressed
      },
      dest: {
        value: leftTouchpadPressed2
      },
      xform: xforms.copy
    },
    {
      src: {
        x: rAxis("joyX"),
        y: rAxis("joyY")
      },
      dest: {
        value: rJoy
      },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: rJoy
      },
      dest: {
        north: rDpadNorth,
        south: rDpadSouth,
        east: rDpadEast,
        west: rDpadWest,
        center: rDpadCenter
      },
      xform: xforms.vec2dpad(0.35, false, true)
    },
    {
      src: [rDpadNorth, rDpadSouth, rDpadCenter],
      dest: { value: rDpadCenterStrip },
      xform: xforms.any
    },
    {
      src: {
        value: rButton("touchpad").pressed
      },
      dest: {
        value: rTouchpadRising
      },
      xform: xforms.rising
    },
    {
      src: {
        value: rButton("touchpad").pressed
      },
      dest: {
        value: rTouchpadFalling
      },
      xform: xforms.falling
    },
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadEast
      },
      dest: {
        value: rSnapRight
      },
      xform: xforms.copyIfTrue,
      priority: 1
    },
    {
      src: { value: paths.device.keyboard.key("e") },
      dest: { value: keyboardSnapRight },
      xform: xforms.rising
    },
    {
      src: [rSnapRight, keyboardSnapRight],
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
      src: { value: paths.device.keyboard.key(" ") },
      dest: { value: thawViaKeyboard },
      xform: xforms.falling
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
      xform: xforms.rising
    },
    {
      src: { value: rButton("touchpad").pressed, bool: rDpadCenterStrip },
      dest: { value: ensureFrozenViaDpad },
      root: rootForFrozenOverrideWhenHolding,
      xform: xforms.copyIfTrue
    },
    {
      src: { value: rTouchpadFalling },
      dest: { value: thawViaDpad },
      xform: xforms.copy
    },
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadWest
      },
      dest: {
        value: rSnapLeft
      },
      xform: xforms.copyIfTrue,
      priority: 1
    },
    {
      src: { value: paths.device.keyboard.key("q") },
      dest: { value: keyboardSnapLeft },
      xform: xforms.rising
    },
    {
      src: [rSnapLeft, keyboardSnapLeft],
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.any
    },

    {
      src: {
        value: lAxis("joyX")
      },
      dest: {
        value: lJoyXScaled
      },
      xform: xforms.scale(1.5) // horizontal character speed modifier
    },
    {
      src: {
        value: lAxis("joyY")
      },
      dest: { value: lJoyYScaled },
      xform: xforms.scale(1.5) // vertical character speed modifier
    },
    {
      src: {
        x: lJoyXScaled,
        y: lJoyYScaled
      },
      dest: { value: lJoyScaled },
      xform: xforms.compose_vec2
    },
    {
      src: {
        bool: leftTouchpadPressed2,
        value: lJoyScaled
      },
      dest: { value: lCharacterAcceleration },
      xform: xforms.copyIfTrue
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
      src: {
        first: wasd_vec2,
        second: arrows_vec2
      },
      dest: { value: keyboardCharacterAcceleration },
      xform: xforms.max_vec2
    },
    {
      src: {
        first: lCharacterAcceleration,
        second: keyboardCharacterAcceleration
      },
      dest: {
        value: characterAcceleration
      },
      xform: xforms.max_vec2
    },
    {
      src: { value: characterAcceleration },
      dest: { value: paths.actions.characterAcceleration },
      xform: xforms.normalize_vec2
    },
    {
      src: { value: paths.device.keyboard.key("shift") },
      dest: { value: keyboardBoost },
      xform: xforms.copy
    },
    {
      src: {
        value: lButton("top").pressed
      },
      dest: {
        value: leftBoost
      },
      xform: xforms.copy
    },
    {
      src: {
        value: rButton("top").pressed
      },
      dest: {
        value: rightBoost
      },
      xform: xforms.copy
    },
    {
      src: [keyboardBoost, leftBoost, rightBoost],
      dest: { value: paths.actions.boost },
      xform: xforms.any
    },
    {
      src: { value: rPose },
      dest: { value: paths.actions.cursor.pose },
      xform: xforms.copy
    },
    {
      src: { value: rPose },
      dest: { value: paths.actions.rightHand.pose },
      xform: xforms.copy
    },
    {
      src: { value: lPose },
      dest: { value: paths.actions.leftHand.pose },
      xform: xforms.copy
    }
  ],
  [sets.rightHandTeleporting]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: rTriggerStopTeleport },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: { value: rButton("touchpad").pressed },
      dest: { value: rTouchpadStopTeleport },
      xform: xforms.falling
    },
    {
      src: [rTriggerStopTeleport, rTouchpadStopTeleport],
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.any
    }
  ],
  [sets.leftHandHoveringOnNothing]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.startTeleport },
      xform: xforms.rising
    }
  ],

  [sets.leftHandTeleporting]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: leftTriggerFallingStopTeleport },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: [leftTriggerFallingStopTeleport, leftTouchpadFallingStopTeleport, leftGripFallingWhileHoldingPen],
      dest: { value: paths.actions.leftHand.stopTeleport },
      xform: xforms.any
    }
  ],

  [sets.rightHandHoveringOnNothing]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.cursorHoveringOnNothing]: [],

  [sets.cursorHoveringOnUI]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.cursorHoveringOnVideo]: [
    {
      src: {
        value: rAxis("joyY"),
        touching: rButton("touchpad").touched
      },
      dest: { value: paths.actions.cursor.mediaVolumeMod },
      xform: xforms.touch_axis_scroll(0.1)
    }
  ],

  [sets.leftHandHoveringOnInteractable]: [
    {
      src: { value: leftGripPressed2 },
      dest: { value: lGripRisingGrab },
      xform: xforms.rising
    },
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: lTriggerRisingGrab },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: [lGripRisingGrab],
      dest: { value: paths.actions.leftHand.grab },
      xform: xforms.any
    }
  ],

  [sets.leftHandHoldingInteractable]: [
    {
      src: { value: leftGripPressed2 },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.falling,
      priority: 1
    }
  ],

  [sets.leftHandHoveringOnPen]: [],
  [sets.leftHandHoldingPen]: [
    {
      src: { value: leftGripPressed2 },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: { value: leftGripPressed2 },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.noop,
      priority: 2
    },
    {
      src: { value: leftTouchpadPressed2 },
      dest: { value: leftTouchpadFallingStopTeleport },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: {
        value: leftTouchpadPressed2
      },
      dest: {
        value: lTouchpadRising1
      },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: {
        bool: lTouchpadRising1,
        value: lDpadCenter
      },
      dest: { value: paths.actions.leftHand.startTeleport },
      xform: xforms.copyIfTrue,
      priority: 1
    },
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.startDrawing },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: lTriggerFallingStopDrawing },
      xform: xforms.falling,
      priority: 2
    },
    {
      src: { value: leftGripPressed2 },
      dest: { value: lGripFallingStopDrawing },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: { value: leftGripPressed2 },
      dest: { value: leftGripFallingWhileHoldingPen },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: [lTriggerFallingStopDrawing, lGripFallingStopDrawing],
      dest: { value: paths.actions.leftHand.stopDrawing },
      xform: xforms.any
    },
    {
      src: {
        value: leftTouchpadPressed2
      },
      dest: {
        value: lTouchpadRising2
      },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: {
        bool: lTouchpadRising2,
        value: lDpadNorth
      },
      dest: {
        value: paths.actions.leftHand.penNextColor
      },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: {
        bool: lTouchpadRising2,
        value: lDpadSouth
      },
      dest: {
        value: paths.actions.leftHand.penPrevColor
      },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: {
        value: lAxis("joyX"),
        touching: lButton("touchpad").touched
      },
      dest: { value: paths.actions.leftHand.scalePenTip },
      xform: xforms.touch_axis_scroll(0.05)
    },
    {
      src: { value: lButton("top").pressed },
      dest: { value: paths.actions.leftHand.undoDrawing },
      xform: xforms.rising,
      priority: 2
    }
  ],

  [sets.cursorHoveringOnInteractable]: [
    {
      src: { value: rightGripPressed2 },
      dest: { value: rGripRisingGrab },
      xform: xforms.rising
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: rTriggerRisingGrab },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: [rGripRisingGrab],
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.any
    }
  ],

  [sets.cursorHoldingUI]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: {
        value: cursorDrop2
      },
      xform: xforms.falling,
      priority: 4
    }
  ],

  [sets.cursorHoldingInteractable]: [
    {
      src: {
        value: rAxis("joyY"),
        touching: rButton("touchpad").touched
      },
      dest: { value: paths.actions.cursor.modDelta },
      xform: xforms.touch_axis_scroll(-1)
    },
    {
      src: { value: rightGripPressed2 },
      dest: { value: cursorDrop1 },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: [cursorDrop1, cursorDrop2],
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.any
    },
    {
      src: {},
      dest: { value: ensureFrozenViaDpad },
      root: rootForFrozenOverrideWhenHolding,
      xform: xforms.always(false)
    }
  ],

  [sets.cursorHoveringOnPen]: [],

  [sets.cursorHoldingPen]: [
    {
      src: [cursorDrop1],
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.noop,
      priority: 1
    },
    {
      src: [cursorDrop2],
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.noop,
      priority: 1
    },
    {
      src: { value: rightGripPressed2 },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadCenter
      },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.startDrawing },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.stopDrawing },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: {
        value: rAxis("joyX"),
        touching: rButton("touchpad").touched
      },
      dest: { value: paths.actions.cursor.scalePenTip },
      xform: xforms.touch_axis_scroll(0.1)
    },
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadNorth
      },
      dest: {
        value: paths.actions.cursor.penNextColor
      },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadSouth
      },
      dest: {
        value: paths.actions.cursor.penPrevColor
      },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: { value: rButton("top").pressed },
      dest: { value: paths.actions.cursor.undoDrawing },
      xform: xforms.rising,
      priority: 2
    }
  ],

  [sets.rightHandHoveringOnInteractable]: [
    {
      src: { value: rightGripPressed2 },
      dest: { value: rGripRisingGrab },
      xform: xforms.rising
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: rTriggerRisingGrab },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: [rGripRisingGrab],
      dest: { value: paths.actions.rightHand.grab },
      xform: xforms.any
    }
  ],

  [sets.rightHandHoldingInteractable]: [
    {
      src: { value: rightGripPressed2 },
      dest: { value: rHandDrop1 },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: {
        value: rHandDrop2
      },
      xform: xforms.falling,
      priority: 2
    },
    {
      src: [rHandDrop1],
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.any,
      priority: 2
    },
    {
      src: {},
      dest: { value: ensureFrozenViaDpad },
      root: rootForFrozenOverrideWhenHolding,
      xform: xforms.always(false)
    }
  ],
  [sets.rightHandHoveringOnPen]: [],
  [sets.rightHandHoldingPen]: [
    {
      src: [rHandDrop1],
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.noop,
      priority: 1
    },
    {
      src: { value: rightGripPressed2 },
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadCenter
      },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.copyIfTrue
    },
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
        bool: rTouchpadRising,
        value: rDpadNorth
      },
      dest: {
        value: paths.actions.rightHand.penNextColor
      },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadSouth
      },
      dest: {
        value: paths.actions.rightHand.penPrevColor
      },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: {
        value: rAxis("joyX"),
        touching: rButton("touchpad").touched
      },
      dest: { value: paths.actions.rightHand.scalePenTip },
      xform: xforms.touch_axis_scroll(0.05)
    },
    {
      src: { value: rButton("top").pressed },
      dest: { value: paths.actions.rightHand.undoDrawing },
      xform: xforms.rising,
      priority: 2
    }
  ],

  [sets.cursorHoveringOnCamera]: [],
  [sets.rightHandHoveringOnCamera]: [],
  [sets.leftHandHoveringOnCamera]: [],

  [sets.rightHandHoldingCamera]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.takeSnapshot },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.noop },
      xform: xforms.falling,
      priority: 3
    }
  ],
  [sets.leftHandHoldingCamera]: [
    {
      src: { value: lButton("trigger").pressed },
      dest: { value: paths.actions.leftHand.takeSnapshot },
      xform: xforms.rising
    }
  ],
  [sets.cursorHoldingCamera]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.takeSnapshot },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.noop },
      xform: xforms.falling,
      priority: 3
    }
  ],
  [sets.inputFocused]: [
    {
      src: { value: "/device/keyboard" },
      dest: { value: paths.noop },
      xform: xforms.noop,
      priority: 1000
    }
  ]
});
