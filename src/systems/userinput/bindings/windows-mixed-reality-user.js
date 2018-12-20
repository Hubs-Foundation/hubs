import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

const v = name => {
  return `/wmr-user/wmr-var/${name}`;
};

const lGripPressed = paths.device.wmr.left.button("grip").pressed;
const rGripPressed = paths.device.wmr.right.button("grip").pressed;

const rJoy = v("right/joy");
const rJoyNorth = v("right/joy/north");
const rJoyWest = v("right/joy/west");
const rJoyEast = v("right/joy/East");
const rPadPressedY = v("right/pad/pressed/y");

function penBindings(hand, forCursor) {
  const triggerPressed = paths.device.wmr[hand].button("trigger").pressed;
  const padPressed = paths.device.wmr[hand].button("touchpad").pressed;
  const padTouched = paths.device.wmr[hand].button("touchpad").touched;
  const padY = paths.device.wmr[hand].axis("padY");

  const pad = v(hand + "/pad");
  const padWest = v(hand + "/pad/west");
  const padEast = v(hand + "/pad/east");
  const padNorth = v(hand + "/pad/north");
  const padSouth = v(hand + "/pad/south");
  const padCenter = v(hand + "/pad/center");
  const padRising = v(hand + "/pad/rising");
  const padCenterStrip = v(hand + "/pad/centerStrip");
  const padCenterStripTouched = v(hand + "/pad/centerStrip/touched");

  const actions = paths.actions[forCursor ? "cursor" : hand + "Hand"];

  return [
    {
      src: {
        x: paths.device.wmr[hand].axis("padX"),
        y: padY
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
      src: [padNorth, padCenter, padSouth],
      dest: { value: padCenterStrip },
      xform: xforms.any
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

export const wmrUserBindings = addSetsToBindings({
  [sets.global]: [
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
      src: { value: paths.device.wmr.right.pose },
      dest: { value: paths.actions.cursor.pose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.wmr.left.pose },
      dest: { value: paths.actions.leftHand.pose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.wmr.right.pose },
      dest: { value: paths.actions.rightHand.pose },
      xform: xforms.copy
    },
    {
      src: {
        x: paths.device.wmr.right.axis("joyX"),
        y: paths.device.wmr.right.axis("joyY")
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
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.rising
    },
    {
      src: { value: rJoyEast },
      dest: { value: paths.actions.snapRotateRight },
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
      src: { value: paths.device.wmr.right.button("trigger").pressed },
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
    {
      src: { value: lGripPressed },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.falling
    }
  ],
  [sets.cursorHoldingInteractable]: [
    {
      src: {
        bool: paths.device.wmr.right.button("touchpad").pressed,
        value: paths.device.wmr.right.axis("padY")
      },
      dest: { value: rPadPressedY },
      xform: xforms.copyIfTrue
    },
    {
      src: { value: rPadPressedY },
      dest: { value: paths.actions.cursor.modDelta },
      xform: xforms.scale(0.1)
    },
    {
      src: { value: rGripPressed },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.falling
    }
  ],
  [sets.rightHandHoldingInteractable]: [
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

  [sets.leftHandHoldingCamera]: [],
  [sets.cursorHoldingCamera]: [],
  [sets.rightHandHoldingCamera]: [],

  [sets.inputFocused]: []
});
