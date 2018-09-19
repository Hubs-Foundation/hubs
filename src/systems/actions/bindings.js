import { paths } from "./paths";
import { sets } from "./sets";
import { xforms } from "./xforms";

export const gamepadBindings = {
  // [sets.global]: [
  //   {
  //     src: { x: paths.device.gamepad(0).axis(0), y: paths.device.gamepad(0).axis(1) },
  //     dest: { value: paths.app.cameraDelta },
  //     xform: xforms.compose_vec2
  //   }
  // ]
};

export const KBMBindings = {
  [sets.global]: [
    {
      src: { value: paths.device.smartMouse.cursorPose },
      dest: { value: paths.app.cursorPose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.smartMouse.cameraDelta },
      dest: { x: "/var/smartMouseCamDeltaX", y: "/var/smartMouseCamDeltaY" },
      xform: xforms.split_vec2
    },
    {
      src: { value: "/var/smartMouseCamDeltaX" },
      dest: { value: "/var/smartMouseCamDeltaXScaled" },
      xform: xforms.scale(-0.06)
    },
    {
      src: { value: "/var/smartMouseCamDeltaY" },
      dest: { value: "/var/smartMouseCamDeltaYScaled" },
      xform: xforms.scale(-0.1)
    },
    {
      src: { x: "/var/smartMouseCamDeltaXScaled", y: "/var/smartMouseCamDeltaYScaled" },
      dest: { value: paths.app.cameraDelta },
      xform: xforms.compose_vec2
    },
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.app.cursorDrop },
      xform: xforms.falling(),
      priority: 100,
      root: "lmb"
    },
    {
      src: {
        value: `${paths.device.keyboard}l`
      },
      dest: {
        value: paths.app.logDebugFrame
      },
      xform: xforms.rising()
    }
  ],

  [sets.cursorHoldingPen]: [
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.app.cursorStartDrawing },
      xform: xforms.rising(),
      priority: 200
    },
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.app.cursorStopDrawing },
      xform: xforms.falling(),
      priority: 200,
      root: "lmb"
    },
    {
      src: { value: paths.device.mouse.buttonRight },
      dest: { value: paths.app.cursorDrop },
      xform: xforms.falling(),
      priority: 200
    },

    {
      src: {
        bool: `${paths.device.keyboard}alt`,
        value: paths.device.mouse.wheel
      },
      dest: { value: "/var/cursorScalePenTipWheel" },
      xform: xforms.copyIfTrue,
      priority: 200,
      root: "wheel"
    },
    {
      src: { value: "/var/cursorScalePenTipWheel" },
      dest: { value: paths.app.cursorScalePenTip },
      xform: xforms.scale(0.03)
    },
    {
      src: {
        value: `${paths.device.keyboard}q`
      },
      dest: { value: paths.app.cursorPenNextColor },
      xform: xforms.rising()
    },
    {
      src: {
        value: `${paths.device.keyboard}e`
      },
      dest: { value: paths.app.cursorPenPrevColor },
      xform: xforms.rising()
    }
  ],

  [sets.cursorHoldingInteractable]: [
    {
      src: {
        value: paths.device.mouse.wheel
      },
      dest: {
        value: paths.app.cursorModDelta
      },
      xform: xforms.copy,
      root: "wheel",
      priority: 100
    },
    {
      src: {
        bool: `${paths.device.keyboard}alt`,
        value: paths.device.mouse.wheel
      },
      dest: { value: paths.app.cursorModDelta },
      xform: xforms.copyIfFalse
    }
  ],

  [sets.cursorHoveringOnInteractable]: [
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.app.cursorGrab },
      xform: xforms.rising()
    }
  ]
};
