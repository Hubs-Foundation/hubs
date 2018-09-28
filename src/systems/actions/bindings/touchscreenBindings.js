import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";

export const touchscreenBindings = {
  [sets.global]: [
    {
      src: { value: paths.device.touchscreen.cursorPose },
      dest: { value: paths.actions.cursorPose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.touchscreen.cameraDelta },
      dest: { x: "/var/touchscreenCamDeltaX", y: "/var/touchscreenCamDeltaY" },
      xform: xforms.split_vec2
    },
    {
      src: { value: "/var/touchscreenCamDeltaX" },
      dest: { value: "/var/touchscreenCamDeltaXScaled" },
      xform: xforms.scale(0.18)
    },
    {
      src: { value: "/var/touchscreenCamDeltaY" },
      dest: { value: "/var/touchscreenCamDeltaYScaled" },
      xform: xforms.scale(0.35)
    },
    {
      src: { x: "/var/touchscreenCamDeltaXScaled", y: "/var/touchscreenCamDeltaYScaled" },
      dest: { value: paths.actions.cameraDelta },
      xform: xforms.compose_vec2
    },
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.actions.cursorGrab },
      xform: xforms.copy,
      root: "touchscreen.isTouchingGrabbable",
      priority: 100
    },
    {
      src: { value: paths.device.hud.penButton },
      dest: { value: paths.actions.spawnPen },
      xform: xforms.rising,
      root: "hud.penButton",
      priority: 100
    }
  ],
  [sets.cursorHoldingInteractable]: [
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.actions.cursorDrop },
      xform: xforms.falling,
      root: "touchscreen.cursorDrop",
      priority: 100
    }
  ],

  [sets.cursorHoveringOnPen]: [],
  [sets.cursorHoldingPen]: [
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.noop },
      xform: xforms.noop,
      root: "touchscreen.cursorDrop",
      priority: 200
    },
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.actions.cursorStartDrawing },
      xform: xforms.risingWithFrameDelay(5)
    },
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.actions.cursorStopDrawing },
      xform: xforms.falling
    },
    {
      src: { value: paths.device.hud.penButton },
      dest: { value: paths.actions.cursorDrop },
      xform: xforms.rising,
      root: "hud.penButton",
      priority: 200
    }
  ]
};
