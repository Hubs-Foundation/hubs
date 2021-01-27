import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

const lGripPressed = paths.device.wmr.left.grip.pressed;
const rGripPressed = paths.device.wmr.right.grip.pressed;
const rTriggerPressed = paths.device.wmr.right.trigger.pressed;

const rJoyNorth = paths.device.wmr.v("right/joy/north");
const rGripRising = paths.device.wmr.v("right/grip/rising");
const rTriggerRising = paths.device.wmr.v("right/trigger/rising");
const rGripFalling = paths.device.wmr.v("right/grip/falling");
const rTriggerFalling = paths.device.wmr.v("right/trigger/falling");

function dpadVariables(hand) {
  return {
    padWest: paths.device.wmr.v(hand + "/pad/west"),
    padEast: paths.device.wmr.v(hand + "/pad/east"),
    padNorth: paths.device.wmr.v(hand + "/pad/north"),
    padSouth: paths.device.wmr.v(hand + "/pad/south"),
    padCenter: paths.device.wmr.v(hand + "/pad/center"),
    padCenterStrip: paths.device.wmr.v(hand + "/pad/centerStrip")
  };
}

function dpadBindings(hand) {
  const { padWest, padEast, padNorth, padSouth, padCenter, padCenterStrip } = dpadVariables(hand);
  const pad = paths.device.wmr.v(hand + "/pad");
  return [
    {
      src: {
        x: paths.device.wmr[hand].touchpad.axisX,
        y: paths.device.wmr[hand].touchpad.axisY
      },
      dest: { value: pad },
      xform: xforms.compose_vec2
    },
    {
      src: { value: pad },
      dest: {
        west: padWest,
        east: padEast,
        north: padNorth,
        south: padSouth,
        center: padCenter
      },
      xform: xforms.vec2dpad(0.5, false, false)
    },
    {
      src: [padNorth, padCenter, padSouth],
      dest: { value: padCenterStrip },
      xform: xforms.any
    }
  ];
}

const neverFrozenBinding = {
  src: {},
  dest: { value: paths.actions.ensureFrozen },
  xform: xforms.always(false)
};

function penBindings(hand, forCursor) {
  const padY = paths.device.wmr[hand].touchpad.axisY;
  const triggerPressed = paths.device.wmr[hand].trigger.pressed;
  const padPressed = paths.device.wmr[hand].touchpad.pressed;
  const padTouched = paths.device.wmr[hand].touchpad.touched;

  const padRising = paths.device.wmr.v(hand + "/pad/rising");
  const padCenterStripTouched = paths.device.wmr.v(hand + "/pad/centerStrip/touched");
  const { padWest, padEast, padCenter, padCenterStrip } = dpadVariables(hand);

  const actions = forCursor ? paths.actions.cursor[hand] : paths.actions[hand + "Hand"];

  return [
    neverFrozenBinding,
    ...dpadBindings(hand),
    {
      src: { value: triggerPressed },
      dest: { value: actions.startDrawing },
      xform: xforms.rising
    },
    {
      src: { value: triggerPressed },
      dest: { value: actions.stopDrawing },
      xform: xforms.falling
    },
    {
      src: { value: padPressed },
      dest: { value: padRising },
      xform: xforms.rising
    },
    {
      src: { bool: padRising, value: padWest },
      dest: { value: actions.penPrevColor },
      xform: xforms.copyIfTrue
    },
    {
      src: { bool: padRising, value: padEast },
      dest: { value: actions.penNextColor },
      xform: xforms.copyIfTrue
    },
    {
      src: [padCenterStrip, padTouched],
      dest: { value: padCenterStripTouched },
      xform: xforms.all
    },
    {
      src: { value: padY, touching: padCenterStripTouched },
      dest: { value: actions.scalePenTip },
      xform: xforms.touch_axis_scroll(-0.05)
    },
    {
      src: [padRising, padCenter],
      dest: { value: actions.undoDrawing },
      xform: xforms.all
    }
  ];
}

function handPoseBindings(hand) {
  const padTouched = paths.device.wmr[hand].touchpad.touched;
  const triggerPressed = paths.device.wmr[hand].trigger.pressed;
  const gripPressed = paths.device.wmr[hand].grip.pressed;
  const actions = paths.actions[hand + "Hand"];
  return [
    {
      src: { value: padTouched },
      dest: { value: actions.thumb },
      xform: xforms.copy
    },
    {
      src: { value: triggerPressed },
      dest: { value: actions.index },
      xform: xforms.copy
    },
    {
      src: { value: gripPressed },
      dest: { value: actions.middleRingPinky },
      xform: xforms.copy
    }
  ];
}

function freezeBindings() {
  const leftPadPressed = paths.device.wmr.left.touchpad.pressed;
  const rightPadPressed = paths.device.wmr.right.touchpad.pressed;
  const leftPadFalling = paths.device.wmr.v("left/touchpad/falling");
  const rightPadFalling = paths.device.wmr.v("right/touchpad/falling");
  const keyboardSaceFalling = paths.device.wmr.k("space/falling");
  return [
    {
      src: [paths.device.keyboard.key(" "), leftPadPressed, rightPadPressed],
      dest: { value: paths.actions.ensureFrozen },
      xform: xforms.any
    },
    {
      src: { value: paths.device.keyboard.key(" ") },
      dest: { value: keyboardSaceFalling },
      xform: xforms.falling
    },
    {
      src: { value: paths.device.keyboard.key("Tab") },
      dest: { value: paths.actions.toggleFreeze },
      xform: xforms.rising
    },
    {
      src: { value: leftPadPressed },
      dest: { value: leftPadFalling },
      xform: xforms.falling
    },
    {
      src: { value: rightPadPressed },
      dest: { value: rightPadFalling },
      xform: xforms.falling
    },
    {
      src: [keyboardSaceFalling, leftPadFalling, rightPadFalling],
      dest: { value: paths.actions.thaw },
      xform: xforms.any
    }
  ];
}

function characterAccelerationBindings() {
  const wasd_vec2 = paths.device.wmr.k("wasd_vec2");
  const arrows_vec2 = paths.device.wmr.k("arrows_vec2");
  const keyboardCharacterAcceleration = paths.device.wmr.k("characterAcceleration");
  const lJoyXDeadzoned = paths.device.wmr.v("left/joy/x/deadzoned");
  const lJoyYDeadzoned = paths.device.wmr.v("left/joy/y/deadzoned");
  const lJoyXScaled = paths.device.wmr.v("left/joy/x/scaled");
  const lJoyYScaled = paths.device.wmr.v("left/joy/y/scaled");
  const lCharacterAcceleration = paths.device.wmr.v("left/characterAcceleration");
  return [
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
      src: { value: paths.device.wmr.left.joystick.axisX },
      dest: { value: lJoyXDeadzoned },
      xform: xforms.deadzone(0.2)
    },
    {
      src: { value: lJoyXDeadzoned },
      dest: { value: lJoyXScaled },
      xform: xforms.scale(1.5) // horizontal character speed modifier
    },
    {
      src: { value: paths.device.wmr.left.joystick.axisY },
      dest: { value: lJoyYDeadzoned },
      xform: xforms.deadzone(0.2)
    },
    {
      src: { value: lJoyYDeadzoned },
      dest: { value: lJoyYScaled },
      xform: xforms.scale(-1.5) // vertical character speed modifier
    },
    {
      src: { x: lJoyXScaled, y: lJoyYScaled },
      dest: { value: lCharacterAcceleration },
      xform: xforms.compose_vec2
    },
    {
      src: {
        first: lCharacterAcceleration,
        second: keyboardCharacterAcceleration
      },
      dest: { value: paths.actions.characterAcceleration },
      xform: xforms.max_vec2
    },
    {
      src: [
        paths.device.wmr.left.trigger.pressed,
        paths.device.wmr.right.trigger.pressed,
        paths.device.keyboard.key("shift")
      ],
      dest: { value: paths.actions.boost },
      xform: xforms.any
    }
  ];
}

function cursorModDeltaBindings() {
  const { padNorth, padSouth } = dpadVariables("right");
  const rPadNorthOrSouth = paths.device.wmr.v("right/pad/northOrSouth");
  const rPadNorthOrSouthPressed = paths.device.wmr.v("right/pad/northOrSouth/pressed");
  const rPadNorthOrSouthPressedY = paths.device.wmr.v("right/pad/northOrSouthpressed/y");
  return [
    ...dpadBindings("right"),
    {
      src: [padNorth, padSouth],
      dest: { value: rPadNorthOrSouth },
      xform: xforms.any
    },
    {
      src: [rPadNorthOrSouth, paths.device.wmr.right.touchpad.pressed],
      dest: { value: rPadNorthOrSouthPressed },
      xform: xforms.all
    },
    {
      src: {
        bool: rPadNorthOrSouthPressed,
        value: paths.device.wmr.right.touchpad.axisY
      },
      dest: { value: rPadNorthOrSouthPressedY },
      xform: xforms.copyIfTrue
    },
    {
      src: { value: rPadNorthOrSouthPressedY },
      dest: { value: paths.actions.cursor.right.modDelta },
      xform: xforms.scale(0.1)
    }
  ];
}

function cursorMediaVolumeModBindings() {
  const hand = "right";
  const padY = paths.device.wmr[hand].touchpad.axisY;
  const padTouched = paths.device.wmr[hand].touchpad.touched;

  const padCenterStripTouched = paths.device.wmr.v(hand + "/pad/centerStrip/touched");
  const { padCenterStrip } = dpadVariables(hand);

  return [
    ...dpadBindings(hand),
    {
      src: [padCenterStrip, padTouched],
      dest: { value: padCenterStripTouched },
      xform: xforms.all
    },
    {
      src: { value: padY, touching: padCenterStripTouched },
      dest: { value: paths.actions.cursor[hand].mediaVolumeMod },
      xform: xforms.touch_axis_scroll(-0.1)
    }
  ];
}

function holdingCameraBindings(hand, forCursor) {
  const actions = forCursor ? paths.actions.cursor[hand] : paths.actions[hand + "Hand"];
  return [
    neverFrozenBinding,
    {
      src: { value: paths.device.wmr[hand].trigger.pressed },
      dest: { value: actions.takeSnapshot },
      xform: xforms.copy
    }
  ];
}

function teleportationAndRotationBindings() {
  const rJoy = paths.device.wmr.v("right/joy");
  const rJoyWest = paths.device.wmr.v("right/joy/west");
  const rJoyEast = paths.device.wmr.v("right/joy/East");
  const rJoyWestRising = paths.device.wmr.v("right/joy/west/rising");
  const rJoyEastRising = paths.device.wmr.v("right/joy/east/rising");
  const keyboardQRising = paths.device.wmr.k("q/rising");
  const keyboardERising = paths.device.wmr.k("e/rising");
  return [
    {
      src: {
        x: paths.device.wmr.right.joystick.axisX,
        y: paths.device.wmr.right.joystick.axisY
      },
      dest: { value: rJoy },
      xform: xforms.compose_vec2
    },
    {
      src: { value: rJoy },
      dest: {
        north: rJoyNorth,
        west: rJoyWest,
        east: rJoyEast
      },
      xform: xforms.vec2dpad(0.2, false, false)
    },
    {
      src: { value: rJoyNorth },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.rising
    },
    {
      src: { value: rJoyWest },
      dest: { value: rJoyWestRising },
      xform: xforms.rising
    },
    {
      src: { value: rJoyEast },
      dest: { value: rJoyEastRising },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.keyboard.key("q") },
      dest: { value: keyboardQRising },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.keyboard.key("e") },
      dest: { value: keyboardERising },
      xform: xforms.rising
    },
    {
      src: [rJoyWestRising, keyboardQRising],
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.any
    },
    {
      src: [rJoyEastRising, keyboardERising],
      dest: { value: paths.actions.snapRotateRight },
      xform: xforms.any
    }
  ];
}

export const wmrUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: { value: paths.device.wmr.left.matrix },
      dest: { value: paths.actions.leftHand.matrix },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.wmr.right.matrix },
      dest: { value: paths.actions.rightHand.matrix },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.wmr.left.pose },
      dest: { value: paths.actions.leftHand.pose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.wmr.right.pose },
      dest: { value: paths.actions.cursor.right.pose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.wmr.right.pose },
      dest: { value: paths.actions.rightHand.pose },
      xform: xforms.copy
    },
    ...handPoseBindings("left"),
    ...handPoseBindings("right"),
    ...freezeBindings(),
    ...teleportationAndRotationBindings(),
    ...characterAccelerationBindings(),
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
    }
  ],

  [sets.leftHandHoveringOnNothing]: [],
  [sets.rightCursorHoveringOnNothing]: [],
  [sets.rightHandHoveringOnNothing]: [],

  [sets.rightHandTeleporting]: [
    {
      src: { value: rJoyNorth },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.falling
    }
  ],

  [sets.rightCursorHoveringOnUI]: [
    {
      src: { value: rTriggerPressed },
      dest: { value: paths.actions.cursor.right.grab },
      xform: xforms.rising
    }
  ],

  [sets.rightCursorHoveringOnVideo]: [...cursorMediaVolumeModBindings()],

  [sets.leftHandHoveringOnInteractable]: [
    {
      src: { value: lGripPressed },
      dest: { value: paths.actions.leftHand.grab },
      xform: xforms.rising
    }
  ],
  [sets.rightCursorHoveringOnInteractable]: [
    {
      src: { value: rGripPressed },
      dest: { value: rGripRising },
      xform: xforms.rising
    },
    {
      src: { value: rTriggerPressed },
      dest: { value: rTriggerRising },
      xform: xforms.rising
    },
    {
      src: [rGripRising, rTriggerRising],
      dest: { value: paths.actions.cursor.right.grab },
      xform: xforms.any
    }
  ],
  [sets.rightHandHoveringOnInteractable]: [
    {
      src: { value: rGripPressed },
      dest: { value: paths.actions.rightHand.grab },
      xform: xforms.rising
    }
  ],

  [sets.leftHandHoldingInteractable]: [
    neverFrozenBinding,
    {
      src: { value: lGripPressed },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.falling
    }
  ],
  [sets.rightCursorHoldingInteractable]: [
    neverFrozenBinding,
    ...cursorModDeltaBindings(),
    {
      src: { value: rGripPressed },
      dest: { value: rGripFalling },
      xform: xforms.falling
    },
    {
      src: { value: rTriggerPressed },
      dest: { value: rTriggerFalling },
      xform: xforms.falling
    },
    {
      src: [rGripFalling, rTriggerFalling],
      dest: { value: paths.actions.cursor.right.drop },
      xform: xforms.any
    }
  ],
  [sets.rightHandHoldingInteractable]: [
    neverFrozenBinding,
    {
      src: { value: rGripPressed },
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.falling
    }
  ],

  [sets.leftHandHoveringOnPen]: [],
  [sets.rightCursorHoveringOnPen]: [],
  [sets.rightHandHoveringOnPen]: [],

  [sets.leftHandHoldingPen]: penBindings("left"),
  [sets.rightCursorHoldingPen]: penBindings("right", true),
  [sets.rightHandHoldingPen]: penBindings("right"),

  [sets.leftHandHoveringOnCamera]: [],
  [sets.rightCursorHoveringOnCamera]: [],
  [sets.rightHandHoveringOnCamera]: [],

  [sets.leftHandHoldingCamera]: holdingCameraBindings("left"),
  [sets.rightCursorHoldingCamera]: holdingCameraBindings("right", true),
  [sets.rightHandHoldingCamera]: holdingCameraBindings("right"),

  [sets.inputFocused]: [
    {
      src: { value: "/device/keyboard" },
      dest: { value: paths.noop },
      xform: xforms.noop,
      priority: 1000
    }
  ]
});
