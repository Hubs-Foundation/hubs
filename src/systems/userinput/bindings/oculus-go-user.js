import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

export default function generate3DOFTriggerBindings(device) {
  const touchpad = device.v("touchpad");
  const touchpadRising = device.v("touchpad/rising");
  const touchpadFalling = device.v("touchpad/falling");
  const triggerRising = device.v("trigger/rising");
  const triggerFalling = device.v("trigger/falling");
  const dpadNorth = device.v("dpad/north");
  const dpadSouth = device.v("dpad/south");
  const dpadEast = device.v("dpad/east");
  const dpadWest = device.v("dpad/west");
  const dpadCenter = device.v("dpad/center");
  const dpadCenterStrip = device.v("dpad/centerStrip");

  const grabBinding = {
    src: {
      value: triggerRising
    },
    dest: { value: paths.actions.cursor.grab },
    xform: xforms.copy,
    priority: 200
  };

  return addSetsToBindings({
    [sets.global]: [
      {
        src: {
          value: device.button("trigger").pressed
        },
        dest: { value: triggerRising },
        xform: xforms.rising
      },
      {
        src: {
          value: device.button("trigger").pressed
        },
        dest: { value: triggerFalling },
        xform: xforms.falling
      },
      {
        src: {
          value: device.button("touchpad").pressed
        },
        dest: { value: touchpadRising },
        xform: xforms.rising,
        priority: 100
      },
      {
        src: {
          value: device.button("touchpad").pressed
        },
        dest: { value: touchpadFalling },
        xform: xforms.falling,
        priority: 100
      },
      {
        src: {
          x: device.axis("touchpadX"),
          y: device.axis("touchpadY")
        },
        dest: { value: touchpad },
        xform: xforms.compose_vec2
      },
      {
        src: {
          value: touchpad
        },
        dest: {
          north: dpadNorth,
          south: dpadSouth,
          east: dpadEast,
          west: dpadWest,
          center: dpadCenter
        },
        xform: xforms.vec2dpad(0.8)
      },
      {
        src: [dpadNorth, dpadSouth, dpadCenter],
        dest: { value: dpadCenterStrip },
        xform: xforms.any
      },
      {
        src: {
          value: dpadCenterStrip,
          bool: device.button("touchpad").pressed
        },
        dest: {
          value: paths.actions.ensureFrozen
        },
        priority: 100,
        xform: xforms.copyIfTrue
      },
      {
        src: { value: touchpadFalling },
        dest: {
          value: paths.actions.thaw
        },
        xform: xforms.copy
      },
      {
        src: {
          value: dpadEast,
          bool: touchpadRising
        },
        dest: {
          value: paths.actions.snapRotateRight
        },
        xform: xforms.copyIfTrue,
        priority: 100
      },
      {
        src: {
          value: dpadWest,
          bool: touchpadRising
        },
        dest: {
          value: paths.actions.snapRotateLeft
        },
        xform: xforms.copyIfTrue,
        priority: 100
      },

      {
        src: {
          value: triggerRising
        },
        dest: { value: paths.actions.rightHand.startTeleport },
        xform: xforms.copy,
        priority: 100
      },

      {
        src: { value: device.pose },
        dest: { value: paths.actions.cursor.pose },
        xform: xforms.copy
      },
      {
        src: { value: device.pose },
        dest: { value: paths.actions.rightHand.pose },
        xform: xforms.copy
      },

      {
        src: { value: device.button("touchpad").touched },
        dest: { value: paths.actions.rightHand.thumb },
        xform: xforms.copy
      },
      {
        src: { value: device.button("trigger").pressed },
        dest: { value: paths.actions.rightHand.index },
        xform: xforms.copy
      },
      {
        src: { value: device.button("trigger").pressed },
        dest: { value: paths.actions.rightHand.middleRingPinky },
        xform: xforms.copy
      }
    ],

    [sets.cursorHoveringOnInteractable]: [grabBinding],
    [sets.cursorHoveringOnUI]: [grabBinding],

    [sets.cursorHoldingInteractable]: [
      {
        src: {
          value: triggerFalling
        },
        dest: { value: paths.actions.cursor.drop },
        xform: xforms.copy,
        priority: 200
      },
      {
        src: {
          value: device.axis("touchpadY"),
          touching: device.button("touchpad").touched
        },
        dest: { value: paths.actions.cursor.modDelta },
        xform: xforms.touch_axis_scroll()
      },
      {
        src: { value: dpadCenterStrip },
        priority: 200,
        xform: xforms.noop
      }
    ],

    [sets.rightHandTeleporting]: [
      {
        src: {
          value: triggerFalling
        },
        dest: { value: paths.actions.rightHand.stopTeleport },
        xform: xforms.copy,
        priority: 100
      }
    ],

    [sets.cursorHoldingPen]: [
      {
        src: {
          value: triggerRising
        },
        dest: { value: paths.actions.cursor.startDrawing },
        xform: xforms.copy,
        priority: 300
      },
      {
        src: {
          value: triggerFalling
        },
        dest: { value: paths.actions.cursor.stopDrawing },
        xform: xforms.copy,
        priority: 300
      },
      {
        src: {
          value: device.axis("touchpadX"),
          touching: device.button("touchpad").touched
        },
        dest: { value: paths.actions.cursor.scalePenTip },
        xform: xforms.touch_axis_scroll(-0.1)
      },
      {
        src: {
          value: dpadCenterStrip,
          bool: touchpadFalling
        },
        dest: { value: paths.actions.cursor.drop },
        xform: xforms.copyIfTrue,
        priority: 300
      },
      {
        src: {
          value: dpadEast,
          bool: touchpadRising
        },
        dest: {
          value: paths.actions.cursor.penPrevColor
        },
        xform: xforms.copyIfTrue,
        priority: 200
      },
      {
        src: {
          value: dpadWest,
          bool: touchpadRising
        },
        dest: {
          value: paths.actions.cursor.penNextColor
        },
        xform: xforms.copyIfTrue,
        priority: 200
      }
    ],

    [sets.cursorHoldingCamera]: [
      {
        src: {
          value: triggerRising
        },
        dest: { value: paths.actions.cursor.takeSnapshot },
        xform: xforms.copy,
        priority: 300
      },
      {
        src: {
          value: triggerFalling
        },
        xform: xforms.noop,
        priority: 300
      },
      {
        src: {
          value: dpadCenterStrip,
          bool: touchpadFalling
        },
        dest: { value: paths.actions.cursor.drop },
        xform: xforms.copyIfTrue,
        priority: 300
      }
    ]
  });
}
