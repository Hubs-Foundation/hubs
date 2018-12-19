import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

const v = name => {
  return `/wmr-user/wmr-var/${name}`;
};

const lGrip = paths.device.wmr.left.button("grip");
const rGrip = paths.device.wmr.right.button("grip");

const rDpadNorth = v("right/dpad/north");
const rJoy = v("right/joy");

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
        north: rDpadNorth
      },
      xform: xforms.vec2dpad(0.2, false, false)
    }
  ],

  [sets.leftHandHoveringOnNothing]: [
  ],
  [sets.cursorHoveringOnNothing]: [],
  [sets.rightHandHoveringOnNothing]: [
    {
      src: { value: rDpadNorth },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.rising
    }
  ],

  [sets.rightHandTeleporting]: [
    {
      src: { value: rDpadNorth },
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
      src: { value: lGrip.pressed },
      dest: { value: paths.actions.leftHand.grab },
      xform: xforms.rising
    }
  ],
  [sets.cursorHoveringOnInteractable]: [
    {
      src: { value: rGrip.pressed },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising
    }
  ],
  [sets.rightHandHoveringOnInteractable]: [
    {
      src: { value: rGrip.pressed },
      dest: { value: paths.actions.rightHand.grab },
      xform: xforms.rising
    }
  ],

  [sets.leftHandHoldingInteractable]: [
    {
      src: { value: lGrip.pressed },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.falling
    }
  ],
  [sets.cursorHoldingInteractable]: [
    {
      src: { value: rGrip.pressed },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.falling
    }
  ],
  [sets.rightHandHoldingInteractable]: [
    {
      src: { value: rGrip.pressed },
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.falling
    }
  ],

  [sets.leftHandHoveringOnPen]: [],
  [sets.cursorHoveringOnPen]: [],
  [sets.rightHandHoveringOnPen]: [],

  [sets.leftHandHoldingPen]: [],
  [sets.cursorHoldingPen]: [],
  [sets.rightHandHoldingPen]: [],

  [sets.leftHandHoveringOnCamera]: [],
  [sets.cursorHoveringOnCamera]: [],
  [sets.rightHandHoveringOnCamera]: [],

  [sets.leftHandHoldingCamera]: [],
  [sets.cursorHoldingCamera]: [],
  [sets.rightHandHoldingCamera]: [],

  [sets.inputFocused]: []
});
