import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

const wasd_vec2 = "/var/mouse-and-keyboard/wasd_vec2";
const keyboardCharacterAcceleration = "/var/mouse-and-keyboard/keyboardCharacterAcceleration";
const arrows_vec2 = "/var/mouse-and-keyboard/arrows_vec2";
const dropWithRMB = "/vars/mouse-and-keyboard/drop_with_RMB";
const dropWithEsc = "/vars/mouse-and-keyboard/drop_with_esc";

const k = name => {
  return `/keyboard-mouse-user/keyboard-var/${name}`;
};

export const keyboardMouseUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: {
        w: paths.device.keyboard.key("arrowup"),
        a: paths.device.keyboard.key("arrowleft"),
        s: paths.device.keyboard.key("arrowdown"),
        d: paths.device.keyboard.key("arrowright")
      },
      dest: { vec2: arrows_vec2 },
      xform: xforms.wasd_to_vec2
    },
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
      src: {
        first: wasd_vec2,
        second: arrows_vec2
      },
      dest: { value: keyboardCharacterAcceleration },
      xform: xforms.max_vec2
    },
    {
      src: { value: keyboardCharacterAcceleration },
      dest: { value: paths.actions.characterAcceleration },
      xform: xforms.normalize_vec2
    },
    {
      src: { value: paths.device.keyboard.key("shift") },
      dest: { value: paths.actions.boost },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.keyboard.key("Escape") },
      dest: { value: paths.actions.camera.exitMirror },
      xform: xforms.falling
    },
    {
      src: { value: paths.device.keyboard.key("q") },
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.keyboard.key("e") },
      dest: { value: paths.actions.snapRotateRight },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.keyboard.key(" ") },
      dest: { value: paths.actions.ensureFrozen },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.keyboard.key(" ") },
      dest: { value: paths.actions.thaw },
      xform: xforms.falling
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
      xform: xforms.scale(-0.2)
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
        value: paths.device.keyboard.key("m")
      },
      dest: {
        value: paths.actions.muteMic
      },
      xform: xforms.rising
    },
    {
      src: {
        value: paths.device.keyboard.key("t")
      },
      dest: {
        value: paths.actions.focusChat
      },
      xform: xforms.rising
    },
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
      src: {
        value: paths.device.mouse.buttonRight
      },
      dest: {
        value: paths.actions.startGazeTeleport
      },
      xform: xforms.rising,
      priority: 100
    },
    {
      src: {
        value: paths.device.mouse.buttonRight
      },
      dest: {
        value: paths.actions.stopGazeTeleport
      },
      xform: xforms.falling,
      priority: 100
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
      priority: 200
    },
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.actions.cursor.startDrawing },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.actions.cursor.stopDrawing },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: {
        value: k("wheelWithShift")
      },
      dest: { value: "/var/cursorScalePenTipWheel" },
      xform: xforms.copy,
      priority: 200
    },
    {
      src: { value: "/var/cursorScalePenTipWheel" },
      dest: { value: paths.actions.cursor.scalePenTip },
      xform: xforms.scale(0.03)
    },
    {
      src: { value: paths.device.mouse.buttonRight },
      dest: { value: dropWithRMB },
      xform: xforms.falling,
      priority: 200
    },
    {
      src: { value: paths.device.keyboard.key("Escape") },
      dest: { value: dropWithEsc },
      xform: xforms.falling
    },
    {
      src: [dropWithRMB, dropWithEsc],
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.any
    },
    {
      src: {
        bool: paths.device.keyboard.key("control"),
        value: paths.device.keyboard.key("z")
      },
      dest: { value: paths.actions.cursor.undoDrawing },
      xform: xforms.rising
    }
  ],

  [sets.cursorHoldingCamera]: [
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.actions.cursor.takeSnapshot },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: paths.device.mouse.buttonRight },
      dest: { value: dropWithRMB },
      xform: xforms.falling,
      priority: 200
    },
    {
      src: { value: paths.device.keyboard.key("Escape") },
      dest: { value: dropWithEsc },
      xform: xforms.falling
    },
    {
      src: [dropWithRMB, dropWithEsc],
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.any
    }
  ],

  [sets.cursorHoldingInteractable]: [
    {
      src: {
        bool: paths.device.keyboard.key("shift"),
        value: paths.device.mouse.wheel
      },
      dest: {
        value: k("wheelWithShift")
      },
      xform: xforms.copyIfTrue
    },
    {
      src: {
        bool: paths.device.keyboard.key("shift"),
        value: paths.device.mouse.wheel
      },
      dest: {
        value: k("wheelWithoutShift")
      },
      xform: xforms.copyIfFalse
    },
    {
      src: {
        value: k("wheelWithoutShift")
      },
      dest: { value: paths.actions.cursor.modDelta },
      xform: xforms.copy
    },
    {
      src: {
        value: k("wheelWithShift")
      },
      dest: { value: paths.actions.cursor.scaleGrabbedGrabbable },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.actions.cursor.drop },
      xform: xforms.falling,
      priority: 2
    }
  ],

  [sets.cursorHoveringOnInteractable]: [
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising,
      priority: 1
    }
  ],
  [sets.cursorHoveringOnVideo]: [
    {
      src: { value: paths.device.mouse.wheel },
      dest: { value: paths.actions.cursor.mediaVolumeMod },
      xform: xforms.scale(-0.3)
    }
  ],
  [sets.inputFocused]: [
    {
      src: { value: "/device/keyboard" },
      dest: { value: paths.noop },
      xform: xforms.noop,
      priority: 1000
    }
  ],

  [sets.cursorHoveringOnUI]: [
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.actions.cursor.grab },
      xform: xforms.rising
    }
  ]
});
