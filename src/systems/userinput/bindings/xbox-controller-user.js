import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

const button = paths.device.xbox.button;
const axis = paths.device.xbox.axis;
const scaledRightJoystickVertical = paths.device.xbox.v("scaledRightJoystickVertical");
const scaledLeftJoystickCursorDelta = paths.device.xbox.v("scaledLeftJoystickCursorDelta");
const scaledRightJoystickHorizontal = paths.device.xbox.v("scaledRightJoystickHorizontal");
const deadzonedRightJoystickHorizontal = paths.device.xbox.v("deadzonedRightJoystickHorizontal");
const deadzonedRightJoystickVertical = paths.device.xbox.v("deadzonedRightJoystickVertical");
const deadzonedLeftJoystickHorizontal = paths.device.xbox.v("deadzonedLeftJoystickHorizontal");
const deadzonedLeftJoystickVertical = paths.device.xbox.v("deadzonedLeftJoystickVertical");
const vec2Zero = paths.device.xbox.v("vec2Zero");
const zero = paths.device.xbox.v("zero");

function characterAccelerationBindings(disableForwardOnTrigger) {
  const scaledLeftJoystickHorizontal = paths.device.xbox.v("scaledLeftJoystickHorizontal");
  const scaledLeftJoystickVertical = paths.device.xbox.v("scaledLeftJoystickVertical");
  const scaledLeftJoystickForwardAcceleration = paths.device.xbox.v("scaledLeftJoystickForwardAcceleration");
  return [
    {
      src: { value: deadzonedLeftJoystickHorizontal },
      dest: { value: scaledLeftJoystickHorizontal },
      xform: xforms.scale(1.5) // horizontal move speed modifier
    },
    {
      src: { value: deadzonedLeftJoystickVertical },
      dest: { value: scaledLeftJoystickVertical },
      xform: xforms.scale(-1.25) // vertical move speed modifier
    },
    {
      src: {
        bool: button("leftTrigger").pressed,
        value: scaledLeftJoystickVertical
      },
      dest: { value: scaledLeftJoystickForwardAcceleration },
      xform: disableForwardOnTrigger ? xforms.copyIfFalse : xforms.copy
    },
    {
      src: {
        x: scaledLeftJoystickHorizontal,
        y: scaledLeftJoystickForwardAcceleration
      },
      dest: { value: paths.actions.characterAcceleration },
      xform: xforms.compose_vec2
    }
  ];
}

export const xboxControllerUserBindings = addSetsToBindings({
  [sets.rightCursorHoldingPen]: [
    {
      src: { value: button("rightTrigger").pressed },
      dest: { value: paths.actions.cursor.right.startDrawing },
      xform: xforms.rising,
      priority: 200
    },
    {
      src: { value: button("rightTrigger").pressed },
      dest: { value: paths.actions.cursor.right.stopDrawing },
      xform: xforms.falling,
      priority: 200
    },
    {
      src: { value: button("b").pressed },
      dest: { value: paths.actions.cursor.right.drop },
      xform: xforms.rising
    },
    {
      src: { value: button("y").pressed },
      dest: { value: paths.actions.cursor.right.undoDrawing },
      xform: xforms.rising,
      priority: 200
    },
    {
      src: { value: button("a").pressed },
      dest: { value: paths.actions.cursor.right.penNextColor },
      xform: xforms.rising
    },
    {
      src: { value: button("x").pressed },
      dest: { value: paths.actions.cursor.right.penPrevColor },
      xform: xforms.rising
    }
  ],
  [sets.global]: [
    {
      src: {},
      dest: { value: paths.actions.cursor.right.hideLine },
      xform: xforms.always(true)
    },
    {
      src: { value: axis("rightJoystickHorizontal") },
      dest: { value: deadzonedRightJoystickHorizontal },
      xform: xforms.deadzone(0.1)
    },
    {
      src: { value: deadzonedRightJoystickHorizontal },
      dest: { value: scaledRightJoystickHorizontal },
      xform: xforms.scale(-0.125) // horizontal look speed modifier
    },
    {
      src: { value: axis("rightJoystickVertical") },
      dest: { value: deadzonedRightJoystickVertical },
      xform: xforms.deadzone(0.1)
    },
    {
      src: { value: deadzonedRightJoystickVertical },
      dest: { value: scaledRightJoystickVertical },
      xform: xforms.scale(-0.125) // vertical look speed modifier
    },
    {
      src: {},
      dest: { value: zero },
      xform: xforms.always(0)
    },
    {
      src: {
        x: scaledRightJoystickHorizontal,
        y: scaledRightJoystickVertical
      },
      dest: { value: paths.actions.cameraDelta },
      xform: xforms.compose_vec2
    },
    {
      src: { value: paths.actions.cameraDelta },
      dest: { value: paths.actions.lobbyCameraDelta },
      xform: xforms.copy
    },
    {
      src: { value: axis("leftJoystickHorizontal") },
      dest: { value: deadzonedLeftJoystickHorizontal },
      xform: xforms.deadzone(0.1)
    },
    {
      src: { value: axis("leftJoystickVertical") },
      dest: { value: deadzonedLeftJoystickVertical },
      xform: xforms.deadzone(0.1)
    },
    {
      src: { value: button("leftTrigger").pressed },
      dest: { value: paths.actions.boost },
      xform: xforms.copy
    },
    {
      src: { value: button("leftBumper").pressed },
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.rising
    },
    {
      src: { value: button("rightBumper").pressed },
      dest: { value: paths.actions.snapRotateRight },
      xform: xforms.rising
    },
    {
      src: {},
      dest: { value: vec2Zero },
      xform: xforms.vec2Zero
    },
    {
      src: { value: vec2Zero },
      dest: { value: paths.actions.cursor.right.pose },
      xform: xforms.poseFromCameraProjection()
    },
    {
      src: { value: button("y").pressed },
      dest: { value: paths.actions.spawnPen },
      xform: xforms.rising,
      priority: 100
    },
    {
      src: { value: button("dpadUp").pressed },
      dest: { value: paths.actions.ensureFrozen },
      xform: xforms.copy
    },
    {
      src: { value: button("dpadUp").pressed },
      dest: { value: paths.actions.thaw },
      xform: xforms.falling
    },
    {
      src: { value: button("start").pressed },
      dest: { value: paths.actions.toggleFreeze },
      xform: xforms.rising
    },
    {
      src: { value: button("a").pressed },
      dest: { value: paths.actions.startGazeTeleport },
      xform: xforms.rising
    },
    {
      src: { value: button("a").pressed },
      dest: { value: paths.actions.stopGazeTeleport },
      xform: xforms.falling
    }
  ],
  [sets.rightCursorHoldingNothing]: [...characterAccelerationBindings()],
  [sets.rightCursorHoldingInteractable]: [
    ...characterAccelerationBindings(true),
    {
      src: { value: button("rightTrigger").pressed },
      dest: { value: paths.actions.cursor.right.drop },
      xform: xforms.falling,
      priority: 100
    },
    {
      src: { value: deadzonedLeftJoystickVertical },
      dest: { value: scaledLeftJoystickCursorDelta },
      xform: xforms.scale(0.25)
    },
    {
      src: {
        bool: button("leftTrigger").pressed,
        value: scaledLeftJoystickCursorDelta
      },
      dest: { value: paths.actions.cursor.right.modDelta },
      xform: xforms.copyIfTrue
    }
  ],
  [sets.rightCursorHoveringOnUI]: [
    {
      src: { value: button("rightTrigger").pressed },
      dest: { value: paths.actions.cursor.right.grab },
      xform: xforms.rising
    }
  ],
  [sets.rightCursorHoveringOnInteractable]: [
    ...characterAccelerationBindings(),
    {
      src: { value: button("rightTrigger").pressed },
      dest: { value: paths.actions.cursor.right.grab },
      xform: xforms.rising,
      priority: 100
    }
  ]
});
