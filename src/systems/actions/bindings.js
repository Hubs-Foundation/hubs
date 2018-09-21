import { paths } from "./paths";
import { sets } from "./sets";
import { xforms } from "./xforms";

export const xboxBindings = {
  [sets.global]: [
    {
      src: { value: paths.device.xbox.button("a").value },
      dest: { value: "/var/translate/a" },
      xform: xforms.copy
    },
    {
      src: { value: "/var/translate/a" },
      dest: { value: "/var/translate/a_negate" },
      xform: xforms.negate
    },
    {
      src: { value: "/var/translate/a_negate" },
      dest: { value: "/var/translate/forward" },
      xform: xforms.throttleDecrement(20, 10)
    },
    {
      src: { value: "/var/translate/forward" },
      dest: { value: "/var/translate/forward_scaled" },
      xform: xforms.scale(0.4)
    },
    {
      src: { value: "/var/translate/forward_scaled" },
      dest: { value: paths.app.translate.forward },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.xbox.button("b").value },
      dest: { value: "/var/translate/b" },
      xform: xforms.copy
    },
    {
      src: { value: "/var/translate/b" },
      dest: { value: "/var/translate/b_negate" },
      xform: xforms.negate
    },
    {
      src: { value: "/var/translate/b_negate" },
      dest: { value: "/var/translate/backward" },
      xform: xforms.throttleDecrement(30, 9)
    },
    {
      src: { value: "/var/translate/backward" },
      dest: { value: "/var/translate/backward_scaled" },
      xform: xforms.scale(0.4)
    },
    {
      src: { value: "/var/translate/backward_scaled" },
      dest: { value: paths.app.translate.backward },
      xform: xforms.copy
    }
  ]
};

export const gamepadBindings = {
  // [sets.global]: [
  //   {
  //     src: { x: paths.device.gamepad(0).axis(0), y: paths.device.gamepad(0).axis(1) },
  //     dest: { value: paths.app.cameraDelta },
  //     xform: xforms.compose_vec2
  //   }
  // ]
};

export const touchscreenBindings = {
  [sets.global]: [
    {
      src: { value: paths.device.touchscreen.cursorPose },
      dest: { value: paths.app.cursorPose },
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
      dest: { value: paths.app.cameraDelta },
      xform: xforms.compose_vec2
    },
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.app.cursorGrab },
      xform: xforms.copy,
      root: "touchscreen.isTouchingGrabbable",
      priority: 100
    },
    {
      src: { value: paths.device.hud.penButton },
      dest: { value: paths.app.spawnPen },
      xform: xforms.rising(),
      root: "hud.penButton",
      priority: 100
    }
  ],
  [sets.cursorHoldingInteractable]: [
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.app.cursorDrop },
      xform: xforms.falling(),
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
      dest: { value: paths.app.cursorStartDrawing },
      xform: xforms.risingWithFrameDelay(5)
    },
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.app.cursorStopDrawing },
      xform: xforms.falling()
    },
    {
      src: { value: paths.device.hud.penButton },
      dest: { value: paths.app.cursorDrop },
      xform: xforms.rising(),
      root: "hud.penButton",
      priority: 200
    }
  ]
};

export const keyboardDebugBindings = {
  [sets.global]: [
    {
      src: {
        value: `${paths.device.keyboard}l`
      },
      dest: {
        value: paths.app.logDebugFrame
      },
      xform: xforms.rising()
    }
  ]
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
        bool: `${paths.device.keyboard}v`,
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
      xform: xforms.scale(0.12)
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
        bool: `${paths.device.keyboard}v`,
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
