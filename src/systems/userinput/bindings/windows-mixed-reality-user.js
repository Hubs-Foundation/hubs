import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

const v = name => {
  return `/wmr-user/wmr-var/${name}`;
};
const k = name => {
  return `/wmr-user/keyboard-var/${name}`;
};

const lGripPressed = paths.device.wmr.left.grip.pressed;
const rGripPressed = paths.device.wmr.right.grip.pressed;

const rJoyNorth = v("right/joy/north");

function dpadVariables(hand) {
  return {
    padWest: v(hand + "/pad/west"),
    padEast: v(hand + "/pad/east"),
    padNorth: v(hand + "/pad/north"),
    padSouth: v(hand + "/pad/south"),
    padCenter: v(hand + "/pad/center"),
    padCenterStrip: v(hand + "/pad/centerStrip")
  };
}

function dpadBindings(hand) {
  const { padWest, padEast, padNorth, padSouth, padCenter, padCenterStrip } = dpadVariables(hand);
  const pad = v(hand + "/pad");
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

  const padRising = v(hand + "/pad/rising");
  const padCenterStripTouched = v(hand + "/pad/centerStrip/touched");
  const { padWest, padEast, padCenter, padCenterStrip } = dpadVariables(hand);

  const actions = paths.actions[forCursor ? "cursor" : hand + "Hand"];

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

function freezeBindings(hand) {
  const padPressed = paths.device.wmr[hand].touchpad.pressed;
  return [
    {
      src: [paths.device.keyboard.key(" "), padPressed],
      dest: { value: paths.actions.ensureFrozen },
      xform: xforms.any
    },
    {
      src: { value: padPressed },
      dest: { value: paths.actions.thaw },
      xform: xforms.falling
    }
  ];
}

function characterAccelerationBindings() {
  const wasd_vec2 = k("wasd_vec2");
  const arrows_vec2 = k("arrows_vec2");
  const keyboardCharacterAcceleration = k("characterAcceleration");
  const lJoyXDeadzoned = v("left/joy/x/deadzoned");
  const lJoyYDeadzoned = v("left/joy/y/deadzoned");
  const lJoyXScaled = v("left/joy/x/scaled");
  const lJoyYScaled = v("left/joy/y/scaled");
  const lCharacterAcceleration = v("left/characterAcceleration");
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
      xform: xforms.deadzone(0.1)
    },
    {
      src: { value: lJoyXDeadzoned },
      dest: { value: lJoyXScaled },
      xform: xforms.scale(1.5) // horizontal character speed modifier
    },
    {
      src: { value: paths.device.wmr.left.joystick.axisY },
      dest: { value: lJoyYDeadzoned },
      xform: xforms.deadzone(0.1)
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
  const rPadNorthOrSouth = v("right/pad/northOrSouth");
  const rPadNorthOrSouthPressed = v("right/pad/northOrSouth/pressed");
  const rPadNorthOrSouthPressedY = v("right/pad/northOrSouthpressed/y");
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
      dest: { value: paths.actions.cursor.modDelta },
      xform: xforms.scale(0.1)
    }
  ];
}

function holdingCameraBindings(hand, forCursor) {
  const actions = paths.actions[forCursor ? "cursor" : hand + "Hand"];
  return [
    neverFrozenBinding,
    {
      src: { value: paths.device.wmr[hand].trigger.pressed },
      dest: { value: actions.takeSnapshot },
      xform: xforms.rising
    }
  ];
}

function teleportationAndRotationBindings() {
  const rJoy = v("right/joy");
  const rJoyWest = v("right/joy/west");
  const rJoyEast = v("right/joy/East");
  const rJoyWestRising = v("right/joy/west/rising");
  const rJoyEastRising = v("right/joy/east/rising");
  const keyboardQRising = k("q/rising");
  const keyboardERising = k("e/rising");
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
    ...characterAccelerationBindings(),
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
      src: { value: paths.device.wmr.left.pose },
      dest: { value: paths.actions.leftHand.pose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.wmr.right.pose },
      dest: { value: paths.actions.cursor.pose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.wmr.right.pose },
      dest: { value: paths.actions.rightHand.pose },
      xform: xforms.copy
    },
    ...handPoseBindings("left"),
    ...handPoseBindings("right"),
    {
      src: { value: paths.device.keyboard.key(" ") },
      dest: { value: paths.actions.thaw },
      xform: xforms.falling
    },
    ...freezeBindings("left"),
    ...freezeBindings("right"),
    ...teleportationAndRotationBindings(),
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
    }
  ],

  [sets.leftHandHoveringOnNothing]: [],
  [sets.cursorHoveringOnNothing]: [],
  [sets.rightHandHoveringOnNothing]: [],

  [sets.rightHandTeleporting]: [
    {
      src: { value: rJoyNorth },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.falling
    }
  ],

  [sets.cursorHoveringOnUI]: [
    {
      src: { value: paths.device.wmr.right.trigger.pressed },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising
    }
  ],

  [sets.leftHandHoveringOnInteractable]: [
    {
      src: { value: lGripPressed },
      dest: { value: paths.actions.leftHand.grab },
      xform: xforms.rising
    }
  ],
  [sets.cursorHoveringOnInteractable]: [
    {
      src: { value: rGripPressed },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising
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
  [sets.cursorHoldingInteractable]: [
    neverFrozenBinding,
    ...cursorModDeltaBindings(),
    {
      src: { value: rGripPressed },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.falling
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
  [sets.cursorHoveringOnPen]: [],
  [sets.rightHandHoveringOnPen]: [],

  [sets.leftHandHoldingPen]: penBindings("left"),
  [sets.cursorHoldingPen]: penBindings("right", true),
  [sets.rightHandHoldingPen]: penBindings("right"),

  [sets.leftHandHoveringOnCamera]: [],
  [sets.cursorHoveringOnCamera]: [],
  [sets.rightHandHoveringOnCamera]: [],

  [sets.leftHandHoldingCamera]: holdingCameraBindings("left"),
  [sets.cursorHoldingCamera]: holdingCameraBindings("right", true),
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
