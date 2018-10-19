import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";

const v = name => {
  return `/vive-user/vive-var/${name}`;
};

const lButton = paths.device.vive.left.button;
const lAxis = paths.device.vive.left.axis;
const lPose = paths.device.vive.left.pose;
const lJoy = v("left/joy");
const lJoyScaled = v("left/joy/scaled");
const lJoyY = v("left/joyY");
const lJoyYCursorMod = v("left/joyY/cursorMod");
const lJoyXScaled = v("left/joyX/scaled");
const lJoyYScaled = v("left/joyY/scaled");
const lDpadNorth = v("left/dpad/north");
const lDpadSouth = v("left/dpad/south");
const lDpadEast = v("left/dpad/east");
const lDpadWest = v("left/dpad/west");
const lDpadCenter = v("left/dpad/center");
const lTriggerFalling = v("left/trigger/falling");
const lTriggerFallingStopDrawing = v("left/trigger/falling/stopDrawing");
const lGripFallingStopDrawing = v("left/grip/falling/stopDrawing");

const lTriggerRising = v("left/trigger/rising");
const lTriggerRisingGrab = v("right/trigger/rising/grab");
const lGripRisingGrab = v("right/grab/rising/grab");
const lTouchpadRising = v("left/touchpad/rising");
const lCharacterAcceleration = v("left/characterAcceleration");
const lGripFalling = v("left/grip/falling");
const lGripRising = v("left/grip/rising");
const lGripPressed = v("left/grip/pressed");
const leftBoost = v("left/boost");
const lTriggerStartTeleport = v("left/trigger/startTeleport");
const lDpadCenterStartTeleport = v("left/dpadCenter/startTeleport");
const lTriggerStopTeleport = v("left/trigger/stopTeleport");
const lTouchpadStopTeleport = v("left/touchpad/stopTeleport");

const rButton = paths.device.vive.right.button;
const rAxis = paths.device.vive.right.axis;
const rPose = paths.device.vive.right.pose;
const rJoy = v("right/joy");
const rJoyY = v("right/joyY");
const rJoyYCursorMod = v("right/joyY/cursorMod");
const rJoyXScaled = v("right/joyX/scaled");
const rJoyYScaled = v("right/joyY/scaled");
const rDpadNorth = v("right/dpad/north");
const rDpadSouth = v("right/dpad/south");
const rDpadEast = v("right/dpad/east");
const rDpadWest = v("right/dpad/west");
const rDpadCenter = v("right/dpad/center");
const rTriggerFalling = v("right/trigger/falling");
const rTriggerRising = v("right/trigger/rising");
const rTouchpadFalling = v("right/touchpad/falling");
const rTouchpadRising = v("right/touchpad/rising");
const rightBoost = v("right/boost");
const rGripRising = v("right/grip/rising");
const rTriggerRisingGrab = v("right/trigger/rising/grab");
const rGripRisingGrab = v("right/grab/rising/grab");
const rGripFalling = v("right/grip/rising");
const rGripPressed = v("right/grip/pressed");
const cursorDrop1 = v("right/cursorDrop1");
const cursorDrop2 = v("right/cursorDrop2");
const rHandDrop1 = v("right/drop1");
const rHandDrop2 = v("right/drop2");
const rTriggerStartTeleport = v("right/trigger/startTeleport");
const rDpadCenterStartTeleport = v("right/dpadCenter/startTeleport");
const rTriggerStopTeleport = v("right/trigger/stopTeleport");
const rTouchpadStopTeleport = v("right/touchpad/stopTeleport");

const rSnapRight = v("right/snap-right");
const rSnapLeft = v("right/snap-left");

const k = name => {
  return `/vive-user/keyboard-var/${name}`;
};
const keyboardSnapRight = k("snap-right");
const keyboardSnapLeft = k("snap-left");
const keyboardCharacterAcceleration = k("characterAcceleration");
const keyboardBoost = k("boost");

const teleportLeft = [
  {
    src: { value: lButton("trigger").pressed },
    dest: { value: lTriggerStartTeleport },
    xform: xforms.rising,
    root: lTriggerRising,
    priority: 100
  },
  {
    src: {
      bool: lTouchpadRising,
      value: lDpadCenter
    },
    dest: { value: lDpadCenterStartTeleport },
    xform: xforms.copyIfTrue
  },
  {
    src: [lTriggerStartTeleport, lDpadCenterStartTeleport],
    dest: { value: paths.actions.leftHand.startTeleport },
    xform: xforms.any
  }
];
const teleportRight = [
  {
    src: { value: rButton("trigger").pressed },
    dest: { value: rTriggerStartTeleport },
    xform: xforms.rising,
    root: rTriggerRising,
    priority: 100
  },
  {
    src: {
      bool: rTouchpadRising,
      value: rDpadCenter
    },
    dest: { value: rDpadCenterStartTeleport },
    xform: xforms.copyIfTrue
  },
  {
    src: [rTriggerStartTeleport, rDpadCenterStartTeleport],
    dest: { value: paths.actions.rightHand.startTeleport },
    xform: xforms.any
  }
];

export const viveUserBindings = {
  [sets.global]: [
    {
      src: {
        value: paths.device.keyboard.key("b")
      },
      dest: {
        value: paths.actions.toggleScreenShare
      },
      xform: xforms.rising
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
        value: lTouchpadRising
      },
      xform: xforms.rising
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
      xform: xforms.vec2dpad(0.35)
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
        bool: rTouchpadRising,
        value: rDpadEast
      },
      dest: {
        value: rSnapRight
      },
      xform: xforms.copyIfTrue,
      root: rDpadEast,
      priority: 100
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
      src: {
        bool: rTouchpadRising,
        value: rDpadWest
      },
      dest: {
        value: rSnapLeft
      },
      xform: xforms.copyIfTrue,
      root: rDpadWest,
      priority: 100
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
        bool: lButton("touchpad").pressed,
        value: lJoyScaled
      },
      dest: { value: lCharacterAcceleration },
      xform: xforms.copyIfTrue
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
        first: lCharacterAcceleration,
        second: keyboardCharacterAcceleration
      },
      dest: {
        value: paths.actions.characterAcceleration
      },
      xform: xforms.add_vec2
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
      src: { value: rButton("trigger").pressed },
      dest: { value: rTriggerStopTeleport },
      xform: xforms.falling,
      root: rTriggerFalling,
      priority: 100
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
  [sets.leftHandHoveringOnNothing]: [...teleportLeft],

  [sets.leftHandTeleporting]: [
    {
      src: { value: lButton("trigger").pressed },
      dest: { value: lTriggerStopTeleport },
      xform: xforms.falling,
      root: lTriggerFalling,
      priority: 100
    },
    {
      src: { value: lButton("touchpad").pressed },
      dest: { value: lTouchpadStopTeleport },
      xform: xforms.falling
    },
    {
      src: [lTriggerStopTeleport, lTouchpadStopTeleport],
      dest: { value: paths.actions.leftHand.stopTeleport },
      xform: xforms.any
    }
  ],

  [sets.rightHandHoveringOnNothing]: [...teleportRight],

  [sets.cursorHoveringOnNothing]: [],

  [sets.cursorHoveringOnUI]: [
    {
      src: { value: rButton("trigger").pressed },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising,
      root: rTriggerRising,
      priority: 100
    }
  ],

  [sets.leftHandHoveringOnInteractable]: [
    {
      src: { value: lButton("grip").pressed },
      dest: { value: lGripRisingGrab },
      xform: xforms.rising,
      root: lGripRising,
      priority: 200
    },
    {
      src: { value: lButton("trigger").pressed },
      dest: { value: lTriggerRisingGrab },
      xform: xforms.rising,
      root: lTriggerRising,
      priority: 200
    },
    {
      src: [lGripRisingGrab, lTriggerRisingGrab],
      dest: { value: paths.actions.leftHand.grab },
      xform: xforms.any
    }
  ],

  [sets.leftHandHoldingInteractable]: [
    {
      src: { value: lButton("grip").pressed },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.falling,
      root: lGripFalling,
      priority: 200
    }
  ],

  [sets.leftHandHoveringOnPen]: [],
  [sets.leftHandHoldingPen]: [
    {
      src: {
        bool: lTouchpadRising,
        value: lDpadCenter
      },
      dest: { value: paths.actions.leftHand.startTeleport },
      xform: xforms.copyIfTrue
    },
    {
      src: { value: lButton("trigger").pressed },
      dest: { value: paths.actions.leftHand.startDrawing },
      xform: xforms.rising
    },
    {
      src: { value: lButton("trigger").pressed },
      dest: { value: lTriggerFallingStopDrawing },
      xform: xforms.falling
    },
    {
      src: { value: lButton("grip").pressed },
      dest: { value: lGripFallingStopDrawing },
      xform: xforms.falling
    },
    {
      src: [lTriggerFallingStopDrawing, lGripFallingStopDrawing],
      dest: { value: paths.actions.leftHand.stopDrawing },
      xform: xforms.any
    },
    {
      src: {
        bool: lTouchpadRising,
        value: lDpadNorth
      },
      dest: {
        value: paths.actions.leftHand.penNextColor
      },
      xform: xforms.copyIfTrue,
      root: lDpadNorth,
      priority: 200
    },
    {
      src: {
        bool: lTouchpadRising,
        value: lDpadSouth
      },
      dest: {
        value: paths.actions.leftHand.penPrevColor
      },
      xform: xforms.copyIfTrue,
      root: lDpadSouth,
      priority: 200
    },
    {
      src: {
        value: lAxis("joyX"),
        touching: lButton("touchpad").touched
      },
      dest: { value: paths.actions.leftHand.scalePenTip },
      xform: xforms.touch_axis_scroll(0.1)
    }
  ],

  [sets.cursorHoveringOnInteractable]: [
    {
      src: { value: rButton("grip").pressed },
      dest: { value: rGripRisingGrab },
      xform: xforms.rising,
      root: rGripRising,
      priority: 200
    },
    {
      src: { value: rButton("trigger").pressed },
      dest: { value: rTriggerRisingGrab },
      xform: xforms.rising,
      root: rTriggerRising,
      priority: 200
    },
    {
      src: [rGripRisingGrab, rTriggerRisingGrab],
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.any
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
      src: { value: rButton("grip").pressed },
      dest: { value: cursorDrop1 },
      xform: xforms.falling,
      root: rGripFalling,
      priority: 200
    },
    {
      src: { value: rButton("trigger").pressed },
      dest: {
        value: cursorDrop2
      },
      xform: xforms.falling,
      root: rTriggerFalling,
      priority: 200
    },
    {
      src: [cursorDrop1, cursorDrop2],
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.any
    }
  ],

  [sets.cursorHoveringOnPen]: [],

  [sets.cursorHoldingPen]: [
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadCenter
      },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.copyIfTrue
    },
    {
      src: { value: rButton("trigger").pressed },
      dest: { value: paths.actions.cursor.startDrawing },
      xform: xforms.rising
    },
    {
      src: { value: rButton("trigger").pressed },
      dest: { value: paths.actions.cursor.stopDrawing },
      xform: xforms.falling,
      root: rTriggerFalling,
      priority: 300
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
      root: rDpadNorth,
      priority: 200
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
      root: rDpadSouth,
      priority: 200
    }
  ],

  [sets.rightHandHoveringOnInteractable]: [
    {
      src: { value: rButton("grip").pressed },
      dest: { value: rGripRisingGrab },
      xform: xforms.rising,
      root: rGripRising,
      priority: 200
    },
    {
      src: { value: rButton("trigger").pressed },
      dest: { value: rTriggerRisingGrab },
      xform: xforms.rising,
      root: rTriggerRising,
      priority: 200
    },
    {
      src: [rGripRisingGrab, rTriggerRisingGrab],
      dest: { value: paths.actions.rightHand.grab },
      xform: xforms.any
    }
  ],

  [sets.rightHandHoldingInteractable]: [
    {
      src: { value: rButton("grip").pressed },
      dest: { value: rHandDrop1 },
      xform: xforms.falling,
      root: rGripFalling,
      priority: 200
    },
    {
      src: { value: rButton("trigger").pressed },
      dest: {
        value: rHandDrop2
      },
      xform: xforms.falling,
      root: rTriggerFalling,
      priority: 200
    },
    {
      src: [rHandDrop1, rHandDrop2],
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.any
    }
  ],
  [sets.rightHandHoveringOnPen]: [],
  [sets.rightHandHoldingPen]: [
    {
      src: {
        bool: rTouchpadRising,
        value: rDpadCenter
      },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.copyIfTrue
    },
    {
      src: { value: rButton("trigger").pressed },
      dest: { value: paths.actions.rightHand.startDrawing },
      xform: xforms.rising
    },
    {
      src: { value: rButton("trigger").pressed },
      dest: { value: paths.actions.rightHand.stopDrawing },
      xform: xforms.falling,
      root: rTriggerFalling,
      priority: 300
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
      root: rDpadNorth,
      priority: 200
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
      root: rDpadSouth,
      priority: 200
    },
    {
      src: {
        value: rAxis("joyX"),
        touching: rButton("touchpad").touched
      },
      dest: { value: paths.actions.rightHand.scalePenTip },
      xform: xforms.touch_axis_scroll(0.1)
    }
  ],

  [sets.cursorHoveringOnCamera]: [],
  [sets.rightHandHoveringOnCamera]: [],
  [sets.leftHandHoveringOnCamera]: [],

  [sets.rightHandHoldingCamera]: [
    {
      src: { value: rButton("trigger").pressed },
      dest: { value: paths.actions.rightHand.takeSnapshot },
      xform: xforms.rising
    },
    {
      src: { value: rButton("trigger").pressed },
      dest: { value: paths.noop },
      xform: xforms.falling,
      root: rTriggerFalling,
      priority: 400
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
      src: { value: rButton("trigger").pressed },
      dest: { value: paths.actions.cursor.takeSnapshot },
      xform: xforms.rising
    },
    {
      src: { value: rButton("trigger").pressed },
      dest: { value: paths.noop },
      xform: xforms.falling,
      root: rTriggerFalling,
      priority: 400
    }
  ]
};
