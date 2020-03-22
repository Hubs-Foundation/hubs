import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

const v = name => {
  return `/vive-user/vive-var/${name}`;
};

const wakeLeft = `${name}left/wake`;
const wakeRight = `${name}right/wake`;

const lButton = paths.device.vive.left.button;
const lAxis = paths.device.vive.left.axis;
const lPose = paths.device.vive.left.pose;
const lJoy = v("left/joy");
const lJoyScaled = v("left/joy/scaled");
const lJoyXScaled = v("left/joyX/scaled");
const lJoyYScaled = v("left/joyY/scaled");
const lJoyYDeadzoned = v("left/joyY/deadzoned");
const lTouch = v("left/touch");
const lTouchScaled = v("left/touch/scaled");
const lTouchXScaled = v("left/touchX/scaled");
const lTouchY = v("left/touchY");
const lTouchYScaled = v("left/touchY/scaled");
const lDpadNorth1 = v("left/dpad/north1");
const lDpadSouth1 = v("left/dpad/south1");
const lDpadEast1 = v("left/dpad/east1");
const lDpadWest1 = v("left/dpad/west1");
const lDpadCenter1 = v("left/dpad/center1");
const lDpadNorth2 = v("left/dpad/north2");
const lDpadSouth2 = v("left/dpad/south2");
const lDpadEast2 = v("left/dpad/east2");
const lDpadWest2 = v("left/dpad/west2");
const lDpadCenter2 = v("left/dpad/center2");
const lTriggerFallingStopDrawing = v("left/trigger/falling/stopDrawing");
const lGripFallingStopDrawing = v("left/grip/falling/stopDrawing");
const lTriggerRisingGrab = v("left/trigger/rising/grab");
const lGripRisingGrab = v("left/grab/rising/grab");
const lTouchpadRising2 = v("left/touchpad/rising2");
const lTouchpadRising1 = v("left/touchpad/rising1");
const touchCharacterAcceleration = v("left/touch/characterAcceleration");
const lCharacterAcceleration = v("left/characterAcceleration");
const characterAcceleration = v("nonNormalizedCharacterAcceleration");
const leftBoost = v("left/boost");
const leftUndoDrawing = v("left/drawing/undo");

const rButton = paths.device.vive.right.button;
const rAxis = paths.device.vive.right.axis;
const rPose = paths.device.vive.right.pose;
const rTouch = v("right/touch");
const rJoy = v("right/joy");
const rJoyYDeadzoned = v("right/joyY/deadzoned");
const rDpadNorth1 = v("right/dpad/north1");
const rDpadSouth1 = v("right/dpad/south1");
const rDpadEast1 = v("right/dpad/east1");
const rDpadWest1 = v("right/dpad/west1");
const rDpadCenter1 = v("right/dpad/center");
const rDpadNorth2 = v("right/dpad/north2");
const rDpadSouth2 = v("right/dpad/south2");
const rDpadEast2 = v("right/dpad/east2");
const rDpadWest2 = v("right/dpad/west2");
const rDpadCenter2 = v("right/dpad/center2");
const rDpadCenterStrip = v("right/dpad/centerStrip");
const rTouchpadRising = v("right/touchpad/rising");
const rTouchpadFalling = v("right/touchpad/falling");
const rightBoost = v("right/boost");
const rTriggerRisingGrab = v("right/trigger/rising/grab");
const rGripRisingGrab = v("right/grab/rising/grab");
const rightCursorDrop1 = v("right/cursorDrop1");
const rightCursorDrop2 = v("right/cursorDrop2");
const leftCursorDrop1 = v("left/cursorDrop1");
const leftCursorDrop2 = v("left/cursorDrop2");
const rTriggerStopTeleport = v("right/trigger/stopTeleport");
const rTouchpadStopTeleport = v("right/touchpad/stopTeleport");
const rootForFrozenOverrideWhenHolding = "rootForFrozenOverrideWhenHolding";
const rightUndoDrawing = v("right/drawing/undo");

const ensureFrozenViaDpad = v("dpad/ensureFrozen");
const ensureFrozenViaKeyboard = v("keyboard/ensureFrozen");
const ensureFrozenViaButtons = v("buttons/ensureFrozen");

const thawViaDpad = v("dpad/thaw");
const thawViaKeyboard = v("keyboard/thaw");
const thawViaButtons = v("buttons/thaw");

const freezeButtons = v("buttons/freeze");
const inspectButtons = v("buttons/inspect");

const rSnapRight1 = v("right/snap-right");
const rSnapLeft1 = v("right/snap-left");
const rSnapRight2 = v("right/snap-right2");
const rSnapLeft2 = v("right/snap-left2");

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
      src: [ensureFrozenViaDpad, ensureFrozenViaKeyboard, ensureFrozenViaButtons],
      dest: { value: paths.actions.ensureFrozen },
      xform: xforms.any
    },
    {
      src: [thawViaDpad, thawViaKeyboard, thawViaButtons],
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
      src: [lButton("touchpad").touched, lButton("primary").touched],
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
      src: [rButton("touchpad").touched, rButton("primary").touched],
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
        x: lAxis("touchX"),
        y: lAxis("touchY")
      },
      dest: {
        value: lTouch
      },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: lTouch
      },
      dest: {
        north: lDpadNorth1,
        south: lDpadSouth1,
        east: lDpadEast1,
        west: lDpadWest1,
        center: lDpadCenter1
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
        x: rAxis("touchX"),
        y: rAxis("touchY")
      },
      dest: {
        value: rTouch
      },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: rTouch
      },
      dest: {
        north: rDpadNorth1,
        south: rDpadSouth1,
        east: rDpadEast1,
        west: rDpadWest1,
        center: rDpadCenter1
      },
      xform: xforms.vec2dpad(0.35, false, true)
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
        north: rDpadNorth2,
        south: rDpadSouth2,
        east: rDpadEast2,
        west: rDpadWest2,
        center: rDpadCenter2
      },
      xform: xforms.vec2dpad(0.35, false, true)
    },
    {
      src: [rDpadNorth1, rDpadSouth1, rDpadCenter1],
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
        value: rDpadEast1
      },
      dest: {
        value: rSnapRight1
      },
      xform: xforms.copyIfTrue,
      priority: 1
    },
    {
      src: {
        value: rDpadEast2
      },
      dest: {
        value: rSnapRight2
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
      src: [rSnapRight1, rSnapRight2, keyboardSnapRight],
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
      xform: xforms.copy
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
        value: rDpadWest1
      },
      dest: {
        value: rSnapLeft1
      },
      xform: xforms.copyIfTrue,
      priority: 1
    },
    {
      src: {
        value: rDpadWest2
      },
      dest: {
        value: rSnapLeft2
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
      src: [rSnapLeft1, rSnapLeft2, keyboardSnapLeft],
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.any
    },
    {
      src: {
        value: lAxis("touchX")
      },
      dest: {
        value: lTouchXScaled
      },
      xform: xforms.scale(1.5) // horizontal character speed modifier
    },
    {
      src: {
        value: lTouchY
      },
      dest: { value: lTouchYScaled },
      xform: xforms.scale(1.5) // vertical character speed modifier
    },
    {
      src: {
        x: lTouchXScaled,
        y: lTouchYScaled
      },
      dest: { value: lTouchScaled },
      xform: xforms.compose_vec2
    },
    {
      src: {
        bool: leftTouchpadPressed2,
        value: lTouchScaled
      },
      dest: { value: touchCharacterAcceleration },
      xform: xforms.copyIfTrue
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
        first: lJoyScaled,
        second: touchCharacterAcceleration
      },
      dest: { value: lCharacterAcceleration },
      xform: xforms.max_vec2
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
        value: lButton("primary").pressed
      },
      dest: {
        value: leftBoost
      },
      xform: xforms.copy
    },
    {
      src: {
        value: rButton("primary").pressed
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
      src: { value: lPose },
      dest: { value: paths.actions.cursor.left.pose },
      xform: xforms.copy
    },
    {
      src: { value: rPose },
      dest: { value: paths.actions.cursor.right.pose },
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
    },
    {
      src: [
        lButton("primary").pressed,
        lButton("trigger").pressed,
        lButton("grip").pressed,
        lButton("touchpad").pressed
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
        rButton("primary").pressed,
        rButton("trigger").pressed,
        rButton("grip").pressed,
        rButton("touchpad").pressed
      ],
      dest: { value: wakeRight },
      xform: xforms.any
    },
    {
      src: { value: wakeRight },
      dest: { value: paths.actions.cursor.right.wake },
      xform: xforms.rising
    },
    {
      src: [
        rButton("secondary").pressed,
        lButton("secondary").pressed,
        rButton("bumper").pressed,
        lButton("bumper").pressed
      ],
      dest: { value: freezeButtons },
      xform: xforms.any
    },
    {
      src: [rButton("primary").pressed, lButton("primary").pressed],
      dest: { value: inspectButtons },
      xform: xforms.any
    },
    {
      src: { value: freezeButtons },
      dest: { value: ensureFrozenViaButtons },
      xform: xforms.copy
    },
    {
      src: { value: freezeButtons },
      dest: { value: thawViaButtons },
      xform: xforms.falling
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

  [sets.rightCursorHoveringOnNothing]: [],

  [sets.leftCursorHoveringOnNothing]: [],

  [sets.rightCursorHoveringOnUI]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.right.grab },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.leftCursorHoveringOnUI]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.cursor.left.grab },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.rightCursorHoveringOnVideo]: [
    {
      src: {
        value: rAxis("touchY"),
        touching: rButton("touchpad").touched
      },
      dest: { value: paths.actions.cursor.right.mediaVolumeMod },
      xform: xforms.touch_axis_scroll(0.1)
    },
    {
      src: {
        value: rAxis("joyY")
      },
      dest: { value: paths.actions.cursor.right.mediaVolumeMod },
      xform: xforms.scale(0.02)
    }
  ],

  [sets.leftCursorHoveringOnVideo]: [
    {
      src: {
        value: lAxis("touchY"),
        touching: lButton("touchpad").touched
      },
      dest: { value: paths.actions.cursor.left.mediaVolumeMod },
      xform: xforms.touch_axis_scroll(0.1)
    },
    {
      src: {
        value: lAxis("joyY")
      },
      dest: { value: paths.actions.cursor.left.mediaVolumeMod },
      xform: xforms.scale(0.02)
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
      dest: { value: paths.actions.leftHand.stopTeleport },
      xform: xforms.falling,
      priority: 2
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
        value: lDpadCenter1
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
        value: lDpadNorth1
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
        value: lDpadSouth1
      },
      dest: {
        value: paths.actions.leftHand.penPrevColor
      },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: {
        value: lAxis("touchX"),
        touching: lButton("touchpad").touched
      },
      dest: { value: paths.actions.leftHand.scalePenTip },
      xform: xforms.touch_axis_scroll(0.05)
    },
    {
      src: [rButton("primary").pressed, lButton("secondary").pressed],
      dest: { value: leftUndoDrawing },
      xform: xforms.any,
      priority: 1
    },
    {
      src: { value: leftUndoDrawing },
      dest: { value: paths.actions.leftHand.undoDrawing },
      xform: xforms.rising
    },
    {
      src: { value: lButton("primary").pressed },
      dest: { value: paths.actions.leftHand.switchDrawMode },
      xform: xforms.rising,
      priority: 2
    }
  ],

  [sets.rightCursorHoveringOnInteractable]: [
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
      dest: { value: paths.actions.cursor.right.grab },
      xform: xforms.any
    },
    {
      src: { value: inspectButtons },
      dest: { value: paths.actions.startInspecting },
      xform: xforms.rising
    }
  ],

  [sets.leftCursorHoveringOnInteractable]: [
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
      dest: { value: paths.actions.cursor.left.grab },
      xform: xforms.any
    },
    {
      src: { value: inspectButtons },
      dest: { value: paths.actions.startInspecting },
      xform: xforms.rising
    }
  ],

  [sets.rightCursorHoldingUI]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: {
        value: rightCursorDrop2
      },
      xform: xforms.falling,
      priority: 4
    }
  ],

  [sets.leftCursorHoldingUI]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: {
        value: leftCursorDrop2
      },
      xform: xforms.falling,
      priority: 4
    }
  ],

  [sets.rightCursorHoldingInteractable]: [
    {
      src: {
        value: rAxis("touchY"),
        touching: rButton("touchpad").touched
      },
      dest: { value: paths.actions.cursor.right.modDelta },
      xform: xforms.touch_axis_scroll(-1)
    },
    {
      src: {
        value: rAxis("joyY")
      },
      dest: { value: paths.actions.cursor.right.modDelta },
      xform: xforms.scale(-0.02)
    },
    {
      src: { value: rightGripPressed2 },
      dest: { value: rightCursorDrop1 },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: [rightCursorDrop1, rightCursorDrop2],
      dest: { value: paths.actions.cursor.right.drop },
      xform: xforms.any
    },
    {
      src: {},
      dest: { value: ensureFrozenViaDpad },
      root: rootForFrozenOverrideWhenHolding,
      xform: xforms.always(false)
    }
  ],

  [sets.leftCursorHoldingInteractable]: [
    {
      src: {
        value: lAxis("touchY"),
        touching: lButton("touchpad").touched
      },
      dest: { value: paths.actions.cursor.left.modDelta },
      xform: xforms.touch_axis_scroll(-1)
    },
    {
      src: {
        value: lAxis("joyY")
      },
      dest: { value: paths.actions.cursor.left.modDelta },
      xform: xforms.scale(-0.02),
      priority: 1
    },
    {
      src: { value: leftGripPressed2 },
      dest: { value: leftCursorDrop1 },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: [leftCursorDrop1, leftCursorDrop2],
      dest: { value: paths.actions.cursor.left.drop },
      xform: xforms.any
    },
    {
      src: {},
      dest: { value: ensureFrozenViaDpad },
      root: rootForFrozenOverrideWhenHolding,
      xform: xforms.always(false)
    }
  ],

  [sets.rightCursorHoveringOnPen]: [],

  [sets.leftCursorHoveringOnPen]: [],

  [sets.rightCursorHoldingPen]: [
    {
      src: [rightCursorDrop1],
      dest: { value: paths.actions.cursor.right.drop },
      xform: xforms.noop,
      priority: 1
    },
    {
      src: [rightCursorDrop2],
      dest: { value: paths.actions.cursor.right.drop },
      xform: xforms.noop,
      priority: 1
    },
    {
      src: { value: rightGripPressed2 },
      dest: { value: paths.actions.cursor.right.drop },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadCenter1
      },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.copyIfTrue,
      priority: 2
    },
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
      src: {
        value: rAxis("touchX"),
        touching: rButton("touchpad").touched
      },
      dest: { value: paths.actions.cursor.right.scalePenTip },
      xform: xforms.touch_axis_scroll(0.1)
    },
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadNorth1
      },
      dest: {
        value: paths.actions.cursor.right.penNextColor
      },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadSouth1
      },
      dest: {
        value: paths.actions.cursor.right.penPrevColor
      },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: { value: rButton("primary").pressed },
      dest: { value: paths.actions.cursor.right.undoDrawing },
      xform: xforms.rising,
      priority: 2
    }
  ],

  [sets.leftCursorHoldingPen]: [
    {
      src: [leftCursorDrop1],
      dest: { value: paths.actions.cursor.left.drop },
      xform: xforms.noop,
      priority: 1
    },
    {
      src: [leftCursorDrop2],
      dest: { value: paths.actions.cursor.left.drop },
      xform: xforms.noop,
      priority: 1
    },
    {
      src: { value: leftGripPressed2 },
      dest: { value: paths.actions.cursor.left.drop },
      xform: xforms.rising,
      priority: 1
    },
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
      src: {
        value: lAxis("touchX"),
        touching: lButton("touchpad").touched
      },
      dest: { value: paths.actions.cursor.left.scalePenTip },
      xform: xforms.touch_axis_scroll(0.1)
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
        value: lDpadNorth1
      },
      dest: {
        value: paths.actions.cursor.left.penNextColor
      },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: {
        bool: lTouchpadRising1,
        value: lDpadSouth1
      },
      dest: {
        value: paths.actions.cursor.left.penPrevColor
      },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: { value: lButton("primary").pressed },
      dest: { value: paths.actions.cursor.left.undoDrawing },
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
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.falling,
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
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.falling,
      priority: 1
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
      src: {
        bool: rTouchpadRising,
        value: rDpadCenter1
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
        value: rDpadNorth1
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
        value: rDpadSouth1
      },
      dest: {
        value: paths.actions.rightHand.penPrevColor
      },
      xform: xforms.copyIfTrue,
      priority: 2
    },
    {
      src: {
        value: rAxis("touchX"),
        touching: rButton("touchpad").touched
      },
      dest: { value: paths.actions.rightHand.scalePenTip },
      xform: xforms.touch_axis_scroll(0.05)
    },
    {
      src: [lButton("primary").pressed, rButton("secondary").pressed],
      dest: { value: rightUndoDrawing },
      xform: xforms.any,
      priority: 1
    },
    {
      src: { value: rightUndoDrawing },
      dest: { value: paths.actions.rightHand.undoDrawing },
      xform: xforms.rising
    },
    {
      src: { value: rButton("primary").pressed },
      dest: { value: paths.actions.rightHand.switchDrawMode },
      xform: xforms.rising,
      priority: 2
    }
  ],

  [sets.rightCursorHoveringOnCamera]: [],
  [sets.leftCursorHoveringOnCamera]: [],
  [sets.rightHandHoveringOnCamera]: [],
  [sets.leftHandHoveringOnCamera]: [],

  [sets.rightHandHoldingCamera]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.takeSnapshot },
      xform: xforms.copy,
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
      xform: xforms.copy
    }
  ],
  [sets.rightCursorHoldingCamera]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.right.takeSnapshot },
      xform: xforms.copy,
      priority: 3
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.noop },
      xform: xforms.falling,
      priority: 3
    }
  ],
  [sets.leftCursorHoldingCamera]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.cursor.left.takeSnapshot },
      xform: xforms.copy,
      priority: 3
    },
    {
      src: { value: leftTriggerPressed2 },
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
  ],
  [sets.inspecting]: [
    {
      src: { value: inspectButtons },
      dest: { value: paths.actions.stopInspecting },
      xform: xforms.falling
    }
  ]
});

export const viveWandUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: {
        value: lAxis("touchY")
      },
      dest: { value: lTouchY },
      xform: xforms.copy
    }
  ],
  [sets.leftHandHoldingPen]: [
    {
      src: { value: leftGripPressed2 },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.rising,
      priority: 2
    }
  ],
  [sets.rightHandHoldingPen]: [
    {
      src: { value: rightGripPressed2 },
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.rising,
      priority: 2
    }
  ]
});

export const indexUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: {
        value: lAxis("touchY")
      },
      dest: { value: lTouchY },
      xform: xforms.copy
    }
  ]
});

export const viveFocusPlusUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: {
        value: lAxis("touchY")
      },
      dest: { value: lTouchY },
      xform: xforms.negate
    }
  ],
  [sets.leftHandHoldingPen]: [
    {
      src: { value: leftGripPressed2 },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.rising,
      priority: 2
    }
  ],
  [sets.rightHandHoldingPen]: [
    {
      src: { value: rightGripPressed2 },
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.rising,
      priority: 2
    }
  ]
});

export const viveCosmosUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: {
        value: lAxis("touchY")
      },
      dest: { value: lTouchY },
      xform: xforms.copy
    }
  ],
  [sets.leftHandHoldingPen]: [
    {
      src: {
        x: lAxis("joyX"),
        y: lAxis("joyY")
      },
      dest: {
        value: lJoy
      },
      xform: xforms.compose_vec2,
      priority: 1
    },
    {
      src: {
        value: lJoy
      },
      dest: {
        north: lDpadNorth2,
        south: lDpadSouth2,
        east: lDpadEast2,
        west: lDpadWest2,
        center: lDpadCenter2
      },
      xform: xforms.vec2dpad(0.35, false, true)
    },
    {
      src: { value: leftGripPressed2 },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: {
        value: lDpadEast2,
        override: "/device/overrides/foo"
      },
      dest: { value: paths.actions.leftHand.penNextColor },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: {
        value: lDpadWest2,
        override: "/device/overrides/foo"
      },
      dest: { value: paths.actions.leftHand.penPrevColor },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: {
        value: lAxis("joyY")
      },
      dest: {
        value: lJoyYDeadzoned
      },
      xform: xforms.deadzone(0.1),
      priority: 1
    },
    {
      src: { value: lJoyYDeadzoned },
      dest: { value: paths.actions.leftHand.scalePenTip },
      xform: xforms.scaleExp(-0.005, 5),
      priority: 1
    }
  ],
  [sets.rightHandHoldingPen]: [
    {
      src: { value: rightGripPressed2 },
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: { value: rDpadEast2 },
      dest: { value: paths.actions.rightHand.penNextColor },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: { value: rDpadWest2 },
      dest: { value: paths.actions.rightHand.penPrevColor },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: {
        value: rAxis("joyY")
      },
      dest: {
        value: rJoyYDeadzoned
      },
      xform: xforms.deadzone(0.1)
    },
    {
      src: { value: rJoyYDeadzoned },
      dest: { value: paths.actions.rightHand.scalePenTip },
      xform: xforms.scaleExp(-0.005, 5),
      priority: 1
    }
  ]
});
