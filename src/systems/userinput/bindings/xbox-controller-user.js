import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";

const xboxUnscaledCursorScalePenTip = "foobarbazbotbooch";

const button = paths.device.xbox.button;
const axis = paths.device.xbox.axis;
const rightTriggerFalling = "/vars/xbox/rightTriggerFalling";

export const xboxControllerUserBindings = {
  [sets.cursorHoldingInteractable]: [
    {
      src: { value: button("rightTrigger").pressed },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.falling,
      root: rightTriggerFalling,
      priority: 100
    },
    {
      src: {
        bool: button("leftTrigger").pressed,
        value: axis("leftJoystickVertical")
      },
      dest: { value: "/vars/xbox/cursorModDelta" },
      xform: xforms.copyIfTrue
    },
    {
      src: {
        value: "/vars/xbox/cursorModDelta"
      },
      dest: { value: paths.actions.cursor.modDelta },
      xform: xforms.copy
    },
    {
      src: {
        bool: button("leftTrigger").pressed,
        value: axis("leftJoystickVertical")
      },
      dest: { value: "/var/xbox/leftJoystickVertical" },
      xform: xforms.copyIfFalse,
      root: "xbox/leftJoystick",
      priority: 200
    }
  ],
  [sets.cursorHoldingPen]: [
    {
      src: { value: button("rightTrigger").pressed },
      dest: { value: paths.actions.cursor.startDrawing },
      xform: xforms.rising,
      root: "xboxRightTriggerRising",
      priority: 200
    },
    {
      src: { value: button("rightTrigger").pressed },
      dest: { value: paths.actions.cursor.stopDrawing },
      xform: xforms.falling,
      root: rightTriggerFalling,
      priority: 200
    },
    {
      src: { value: button("b").pressed },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.rising
    },
    {
      src: { value: button("y").pressed },
      dest: { value: paths.noop },
      xform: xforms.noop,
      root: "xbox/y",
      priority: 200
    },
    {
      src: { value: button("a").pressed },
      dest: { value: paths.actions.cursor.penNextColor },
      xform: xforms.rising
    },
    {
      src: { value: button("x").pressed },
      dest: { value: paths.actions.cursor.penPrevColor },
      xform: xforms.rising
    },
    {
      src: {
        bool: button("leftTrigger").pressed,
        value: axis("rightJoystickVertical")
      },
      dest: { value: xboxUnscaledCursorScalePenTip },
      xform: xforms.copyIfTrue
    },
    {
      dest: {
        value: paths.actions.cursorScalePenTip
      },
      src: { value: xboxUnscaledCursorScalePenTip },
      xform: xforms.scale(0.01)
    }
  ],
  [sets.global]: [
    {
      src: {
        value: axis("rightJoystickHorizontal")
      },
      dest: { value: "/var/xbox/scaledRightJoystickHorizontal" },
      xform: xforms.scale(-1.5) // horizontal look speed modifier
    },
    {
      src: {
        value: axis("rightJoystickVertical")
      },
      dest: { value: "/var/xbox/scaledRightJoystickVertical" },
      xform: xforms.scale(-1.25) // vertical look speed modifier
    },
    {
      src: {
        x: "/var/xbox/scaledRightJoystickHorizontal",
        y: "/var/xbox/scaledRightJoystickVertical"
      },
      dest: { value: paths.actions.cameraDelta },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: axis("leftJoystickHorizontal")
      },
      dest: { value: "/var/xbox/scaledLeftJoystickHorizontal" },
      xform: xforms.scale(1.5) // horizontal move speed modifier
    },
    {
      src: { value: axis("leftJoystickVertical") },
      dest: { value: "/var/xbox/leftJoystickVertical" },
      xform: xforms.copy,
      root: "xbox/leftJoystick",
      priority: 100
    },
    {
      src: { value: "/var/xbox/leftJoystickVertical" },
      dest: { value: "/var/xbox/scaledLeftJoystickVertical" },
      xform: xforms.scale(-1.25) // vertical move speed modifier
    },
    {
      src: {
        x: "/var/xbox/scaledLeftJoystickHorizontal",
        y: "/var/xbox/scaledLeftJoystickVertical"
      },
      dest: { value: paths.actions.characterAcceleration },
      xform: xforms.compose_vec2
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
      src: { value: button("dpadUp").pressed },
      dest: { value: paths.actions.translate.up },
      xform: xforms.scale(0.1)
    },
    {
      src: { value: button("dpadDown").pressed },
      dest: { value: paths.actions.translate.down },
      xform: xforms.scale(0.1)
    },
    {
      dest: { value: "var/vec2/zero" },
      xform: xforms.vec2Zero
    },
    {
      src: { value: "var/vec2/zero" },
      dest: { value: paths.actions.cursor.pose },
      xform: xforms.poseFromCameraProjection()
    },
    {
      src: { value: button("y").pressed },
      dest: { value: paths.actions.spawnPen },
      xform: xforms.rising,
      root: "xbox/y",
      priority: 100
    }
  ],
  [sets.cursorHoveringOnInteractable]: [
    {
      src: { value: button("rightTrigger").pressed },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising,
      root: "xboxRightTriggerRising",
      priority: 100
    }
  ]
};
