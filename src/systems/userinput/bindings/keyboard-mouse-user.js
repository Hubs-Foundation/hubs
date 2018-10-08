import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";

const wasd_vec2 = "/var/mouse-and-keyboard/wasd_vec2";
export const keyboardMouseUserBindings = {
  [sets.global]: [
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
      src: { value: wasd_vec2 },
      dest: { value: paths.actions.characterAcceleration },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.keyboard.key("shift") },
      dest: { value: paths.actions.boost },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.keyboard.key("q") },
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.rising,
      root: "q",
      priority: 100
    },
    {
      src: { value: paths.device.keyboard.key("e") },
      dest: { value: paths.actions.snapRotateRight },
      xform: xforms.rising,
      root: "e",
      priority: 100
    },
    {
      src: { value: paths.device.hud.penButton },
      dest: { value: paths.actions.spawnPen },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.smartMouse.cursorPose },
      dest: { value: paths.actions.cursor.pose },
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
      dest: { value: paths.actions.cameraDelta },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: paths.device.keyboard.key("l")
      },
      dest: {
        value: paths.actions.logDebugFrame
      },
      xform: xforms.rising
    }
  ],

  [sets.cursorHoldingPen]: [
    {
      src: {
        bool: paths.device.keyboard.key("shift"),
        value: paths.device.keyboard.key("q")
      },
      dest: { value: "/var/shift+q" },
      xform: xforms.copyIfTrue
    },
    {
      src: { value: "/var/shift+q" },
      dest: { value: paths.actions.cursor.penPrevColor },
      xform: xforms.rising
    },
    {
      src: {
        bool: paths.device.keyboard.key("shift"),
        value: paths.device.keyboard.key("e")
      },
      dest: { value: "/var/shift+e" },
      xform: xforms.copyIfTrue
    },
    {
      src: { value: "/var/shift+e" },
      dest: { value: paths.actions.cursor.penNextColor },
      xform: xforms.rising
    },
    {
      src: {
        bool: paths.device.keyboard.key("shift"),
        value: paths.device.keyboard.key("q")
      },
      dest: { value: "/var/notshift+q" },
      xform: xforms.copyIfFalse
    },
    {
      src: { value: "/var/notshift+q" },
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.rising,
      root: "q",
      priority: 200
    },
    {
      src: {
        bool: paths.device.keyboard.key("shift"),
        value: paths.device.keyboard.key("e")
      },
      dest: { value: "/var/notshift+e" },
      xform: xforms.copyIfFalse
    },
    {
      src: { value: "/var/notshift+e" },
      dest: { value: paths.actions.snapRotateRight },
      xform: xforms.rising,
      root: "e",
      priority: 200
    },
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.actions.cursor.startDrawing },
      xform: xforms.rising,
      priority: 200
    },
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.actions.cursor.stopDrawing },
      xform: xforms.falling,
      priority: 200,
      root: "lmb"
    },
    {
      src: { value: paths.device.mouse.buttonRight },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.falling,
    },
    {
      src: {
        bool: paths.device.keyboard.key("shift"),
        value: paths.device.mouse.wheel
      },
      dest: { value: "/var/cursorScalePenTipWheel" },
      xform: xforms.copyIfTrue,
      priority: 200,
      root: "wheel"
    },
    {
      src: { value: "/var/cursorScalePenTipWheel" },
      dest: { value: paths.actions.cursor.scalePenTip },
      xform: xforms.scale(0.12)
    }
  ],

  [sets.cursorHoldingInteractable]: [
    {
      src: {
        value: paths.device.mouse.wheel
      },
      dest: {
        value: paths.actions.cursor.modDelta
      },
      xform: xforms.copy,
      root: "wheel",
      priority: 100
    },
    {
      src: {
        bool: paths.device.keyboard.key("shift"),
        value: paths.device.mouse.wheel
      },
      dest: { value: paths.actions.cursor.modDelta },
      xform: xforms.copyIfFalse
    },
    {
      src: {
        bool: paths.device.keyboard.key("shift"),
        value: paths.device.mouse.wheel
      },
      dest: { value: paths.actions.cursor.scaleGrabbedGrabbable },
      xform: xforms.copyIfTrue,
      priority: 150,
      root: "wheel"
    },
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.falling,
      priority: 100,
      root: "lmb"
    }
  ],

  [sets.cursorHoveringOnInteractable]: [
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising
    }
  ]
};
