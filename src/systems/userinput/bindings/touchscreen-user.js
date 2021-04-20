import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

const zero = "/vars/touchscreen/zero";
const forward = "/vars/touchscreen/pinchDeltaForward";
const touchCamDeltaMaybeInverted = "vars/touchscreen/touchCameraDeltaMaybeInverted";
const touchCamDelta = "vars/touchscreen/touchCameraDelta";
const touchCamDeltaX = "vars/touchscreen/touchCameraDelta/x";
const touchCamDeltaY = "vars/touchscreen/touchCameraDelta/y";
const touchCamDeltaXScaled = "vars/touchscreen/touchCameraDelta/x/scaled";
const touchCamDeltaYScaled = "vars/touchscreen/touchCameraDelta/y/scaled";
const gyroCamDelta = "vars/gyro/gyroCameraDelta";
const gyroCamDeltaXScaled = "vars/gyro/gyroCameraDelta/x/scaled";
const gyroCamDeltaYScaled = "vars/gyro/gyroCameraDelta/y/scaled";
const togglePen = "/vars/touchscreen/togglePen";

export const touchscreenUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: {},
      dest: { value: paths.actions.cursor.right.hideLine },
      xform: xforms.always(true)
    },
    {
      src: { value: paths.device.touchscreen.pinch.delta },
      dest: { value: forward },
      xform: xforms.scale(0.25)
    },
    {
      src: { value: paths.device.touchscreen.tap2 },
      dest: { value: paths.actions.toggleFreeze },
      xform: xforms.copy
    },
    {
      src: {},
      dest: { value: zero },
      xform: xforms.always(0)
    },
    {
      src: { x: zero, y: forward },
      dest: { value: paths.actions.characterAcceleration },
      xform: xforms.compose_vec2
    },
    {
      src: { value: paths.device.touchscreen.cursorPose },
      dest: { value: paths.actions.cursor.right.pose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.touchscreen.touchCameraDelta },
      dest: { x: touchCamDeltaX, y: touchCamDeltaY },
      xform: xforms.split_vec2
    },
    {
      src: { value: touchCamDeltaX },
      dest: { value: touchCamDeltaXScaled },
      xform: xforms.scale(-Math.PI)
    },
    {
      src: { value: touchCamDeltaY },
      dest: { value: touchCamDeltaYScaled },
      xform: xforms.scale(-Math.PI / 2)
    },
    {
      src: { x: touchCamDeltaXScaled, y: touchCamDeltaYScaled },
      dest: { value: touchCamDelta },
      xform: xforms.compose_vec2
    },
    {
      src: { value: touchCamDelta },
      dest: { value: touchCamDeltaMaybeInverted },
      xform: xforms.invert_vec2_if_preference("invertTouchscreenCameraMove")
    },
    {
      src: { value: paths.device.gyro.averageDeltaX },
      dest: { value: gyroCamDeltaXScaled },
      xform: xforms.scale(1.0)
    },
    {
      src: { value: paths.device.gyro.averageDeltaY },
      dest: { value: gyroCamDeltaYScaled },
      xform: xforms.scale(1.0)
    },
    {
      src: { x: gyroCamDeltaYScaled, y: gyroCamDeltaXScaled },
      dest: { value: gyroCamDelta },
      xform: xforms.compose_vec2
    },
    {
      src: {
        first: touchCamDeltaMaybeInverted,
        second: gyroCamDelta
      },
      dest: { value: paths.actions.cameraDelta },
      xform: xforms.add_vec2
    },
    {
      src: { value: touchCamDeltaMaybeInverted },
      dest: { value: paths.actions.lobbyCameraDelta },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.actions.cursor.right.grab },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.hud.penButton },
      dest: { value: togglePen },
      xform: xforms.rising
    },
    {
      src: { value: togglePen },
      dest: { value: paths.actions.spawnPen },
      xform: xforms.rising,
      priority: 2
    }
  ],
  [sets.rightCursorHoldingInteractable]: [
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.actions.cursor.right.drop },
      xform: xforms.falling,
      priority: 1
    }
  ],

  [sets.rightCursorHoveringOnPen]: [],
  [sets.rightCursorHoldingPen]: [
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.actions.cursor.right.startDrawing },
      xform: xforms.risingWithFrameDelay(5),
      priority: 2
    },
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.actions.cursor.right.stopDrawing },
      xform: xforms.falling,
      priority: 2
    },
    {
      src: { value: togglePen },
      dest: { value: paths.actions.cursor.right.drop },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: togglePen },
      dest: { value: paths.actions.pen.remove },
      xform: xforms.rising,
      priority: 3
    }
  ],

  [sets.inspecting]: [
    {
      src: { value: paths.device.touchscreen.pinch.delta },
      dest: { value: paths.actions.inspectZoom },
      xform: xforms.scale(0.025),
      priority: 1
    }
  ]
});
