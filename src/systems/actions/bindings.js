import { paths } from "./paths";
import { sets } from "./sets";
import { xforms } from "./xforms";

const xboxUnscaledCursorScalePenTip = "foobarbazbotbooch";

const leftOculusTouch_scaledJoystickHorizontal = "leftOculusTouch_scaledJoystickHorizontal";
const leftOculusTouch_scaledJoystickVertical = "leftOculusTouch_scaledJoystickVertical";
export const oculusTouchBindings = {
  [sets.global]: [
    {
      src: {
        value: paths.device.leftOculusTouch.axis("joystickHorizontal")
      },
      dest: { value: leftOculusTouch_scaledJoystickHorizontal },
      xform: xforms.scale(1.5) // horizontal character speed modifier
    },
    {
      src: {
        value: paths.device.leftOculusTouch.axis("joystickVertical")
      },
      dest: { value: leftOculusTouch_scaledJoystickVertical },
      xform: xforms.scale(-1.5) // vertical character speed modifier
    },
    {
      src: {
        x: leftOculusTouch_scaledJoystickHorizontal,
        y: leftOculusTouch_scaledJoystickVertical
      },
      dest: { value: paths.app.characterAcceleration },
      xform: xforms.compose_vec2
    },
    {
      src: { value: paths.device.rightOculusTouch.pose },
      dest: { value: paths.app.cursorPose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.rightOculusTouch.button("grip").pressed },
      dest: { value: paths.app.rightHandStopTeleport },
      xform: xforms.falling,
      root: "rightGripFalling",
      priority: 100
    },
    {
      src: { value: paths.device.leftOculusTouch.button("grip").pressed },
      dest: { value: paths.app.leftHandStopTeleport },
      xform: xforms.falling,
      root: "leftGripFalling",
      priority: 100
    }
  ],
  [sets.leftHandHoveringOnNothing]: [
    {
      src: { value: paths.device.leftOculusTouch.button("grip").pressed },
      dest: { value: paths.app.leftHandStartTeleport },
      xform: xforms.rising,
      root: "leftGripRising",
      priority: 100
    }
  ],
  [sets.rightHandHoveringOnNothing]: [
    {
      src: { value: paths.device.rightOculusTouch.button("grip").pressed },
      dest: { value: paths.app.rightHandStartTeleport },
      xform: xforms.rising,
      root: "rightGripRising",
      priority: 100
    }
  ],
  [sets.cursorHoveringOnNothing]: [
    {
      src: { value: paths.device.rightOculusTouch.button("grip").pressed },
      dest: { value: paths.app.rightHandStartTeleport },
      xform: xforms.rising,
      root: "rightGripRising",
      priority: 101
    }
  ],

  [sets.leftHandHoveringOnInteractable]: [
    {
      src: { value: paths.device.leftOculusTouch.button("grip").pressed },
      dest: { value: paths.app.leftHandGrab },
      xform: xforms.rising,
      root: "leftGripRising",
      priority: 200
    }
  ],

  [sets.leftHandHoldingInteractable]: [
    {
      src: { value: paths.device.leftOculusTouch.button("grip").pressed },
      dest: { value: paths.app.leftHandDrop },
      xform: xforms.falling,
      root: "leftGripFalling",
      priority: 200
    }
  ],

  [sets.cursorHoveringOnInteractable]: [
    {
      src: { value: paths.device.rightOculusTouch.button("grip").pressed },
      dest: { value: paths.app.cursorGrab },
      xform: xforms.rising,
      root: "rightGripRising",
      priority: 200
    }
  ],

  [sets.cursorHoldingInteractable]: [
    {
      src: { value: paths.device.rightOculusTouch.button("grip").pressed },
      dest: { value: paths.app.cursorDrop },
      xform: xforms.falling,
      root: "rightGripFalling",
      priority: 200
    }
  ],

  [sets.rightHandHoveringOnInteractable]: [
    {
      src: { value: paths.device.rightOculusTouch.button("grip").pressed },
      dest: { value: paths.app.rightHandGrab },
      xform: xforms.rising,
      root: "rightGripRising",
      priority: 200
    }
  ],

  [sets.rightHandHoldingInteractable]: [
    {
      src: { value: paths.device.rightOculusTouch.button("grip").pressed },
      dest: { value: paths.app.rightHandDrop },
      xform: xforms.falling,
      root: "rightGripFalling",
      priority: 200
    }
  ]
};
export const xboxBindings = {
  [sets.cursorHoldingInteractable]: [
    {
      src: { value: paths.device.xbox.button("rightTrigger").pressed },
      dest: { value: paths.app.cursorDrop },
      xform: xforms.falling,
      root: "xboxRightTriggerFalling",
      priority: 100
    },
    {
      src: {
        bool: paths.device.xbox.button("leftTrigger").pressed,
        value: paths.device.xbox.axis("leftJoystickVertical")
      },
      dest: { value: "/vars/xbox/cursorModDelta" },
      xform: xforms.copyIfTrue
    },
    {
      src: {
        value: "/vars/xbox/cursorModDelta"
      },
      dest: { value: paths.app.cursorModDelta },
      xform: xforms.copy
    },
    {
      src: {
        bool: paths.device.xbox.button("leftTrigger").pressed,
        value: paths.device.xbox.axis("leftJoystickVertical")
      },
      dest: { value: "/var/xbox/leftJoystickVertical" },
      xform: xforms.copyIfFalse,
      root: "xbox/leftJoystick",
      priority: 200
    }
  ],
  [sets.cursorHoldingPen]: [
    {
      src: { value: paths.device.xbox.button("rightTrigger").pressed },
      dest: { value: paths.app.cursorStartDrawing },
      xform: xforms.rising,
      root: "xboxRightTriggerRising",
      priority: 200
    },
    {
      src: { value: paths.device.xbox.button("rightTrigger").pressed },
      dest: { value: paths.app.cursorStopDrawing },
      xform: xforms.falling,
      root: "xboxRightTriggerFalling",
      priority: 200
    },
    {
      src: { value: paths.device.xbox.button("b").pressed },
      dest: { value: paths.app.cursorDrop },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.xbox.button("y").pressed },
      dest: { value: paths.noop },
      xform: xforms.noop,
      root: "xbox/y",
      priority: 200
    },
    {
      src: { value: paths.device.xbox.button("a").pressed },
      dest: { value: paths.app.cursorPenNextColor },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.xbox.button("x").pressed },
      dest: { value: paths.app.cursorPenPrevColor },
      xform: xforms.rising
    },
    {
      src: {
        bool: paths.device.xbox.button("leftTrigger").pressed,
        value: paths.device.xbox.axis("rightJoystickVertical")
      },
      dest: { value: xboxUnscaledCursorScalePenTip },
      xform: xforms.copyIfTrue
    },
    {
      dest: {
        value: paths.app.cursorScalePenTip
      },
      src: { value: xboxUnscaledCursorScalePenTip },
      xform: xforms.scale(0.01)
    }
  ],
  [sets.global]: [
    {
      src: {
        value: paths.device.xbox.axis("rightJoystickHorizontal")
      },
      dest: { value: "/var/xbox/scaledRightJoystickHorizontal" },
      xform: xforms.scale(-1.5) // horizontal look speed modifier
    },
    {
      src: {
        value: paths.device.xbox.axis("rightJoystickVertical")
      },
      dest: { value: "/var/xbox/scaledRightJoystickVertical" },
      xform: xforms.scale(-1.25) // vertical look speed modifier
    },
    {
      src: {
        x: "/var/xbox/scaledRightJoystickHorizontal",
        y: "/var/xbox/scaledRightJoystickVertical"
      },
      dest: { value: paths.app.cameraDelta },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: paths.device.xbox.axis("leftJoystickHorizontal")
      },
      dest: { value: "/var/xbox/scaledLeftJoystickHorizontal" },
      xform: xforms.scale(1.5) // horizontal move speed modifier
    },
    {
      src: { value: paths.device.xbox.axis("leftJoystickVertical") },
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
      dest: { value: paths.app.characterAcceleration },
      xform: xforms.compose_vec2
    },
    {
      src: { value: paths.device.xbox.button("leftTrigger").pressed },
      dest: { value: paths.app.boost },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.xbox.button("leftBumper").pressed },
      dest: { value: paths.app.snapRotateLeft },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.xbox.button("rightBumper").pressed },
      dest: { value: paths.app.snapRotateRight },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.xbox.button("dpadUp").pressed },
      dest: { value: paths.app.translate.up },
      xform: xforms.scale(0.1)
    },
    {
      src: { value: paths.device.xbox.button("dpadDown").pressed },
      dest: { value: paths.app.translate.down },
      xform: xforms.scale(0.1)
    },
    {
      dest: { value: "var/vec2/zero" },
      xform: xforms.vec2Zero
    },
    {
      src: { value: "var/vec2/zero" },
      dest: { value: paths.app.cursorPose },
      xform: xforms.poseFromCameraProjection()
    },
    {
      src: { value: paths.device.xbox.button("y").pressed },
      dest: { value: paths.app.spawnPen },
      xform: xforms.rising,
      root: "xbox/y",
      priority: 100
    }
  ],
  [sets.cursorHoveringOnInteractable]: [
    {
      src: { value: paths.device.xbox.button("rightTrigger").pressed },
      dest: { value: paths.app.cursorGrab },
      xform: xforms.rising,
      root: "xboxRightTriggerRising",
      priority: 100
    }
  ]
};

export const gamepadBindings = {};

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
      xform: xforms.rising,
      root: "hud.penButton",
      priority: 100
    }
  ],
  [sets.cursorHoldingInteractable]: [
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.app.cursorDrop },
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
      dest: { value: paths.app.cursorStartDrawing },
      xform: xforms.risingWithFrameDelay(5)
    },
    {
      src: { value: paths.device.touchscreen.isTouchingGrabbable },
      dest: { value: paths.app.cursorStopDrawing },
      xform: xforms.falling
    },
    {
      src: { value: paths.device.hud.penButton },
      dest: { value: paths.app.cursorDrop },
      xform: xforms.rising,
      root: "hud.penButton",
      priority: 200
    }
  ]
};

export const keyboardDebugBindings = {
  [sets.global]: [
    {
      src: {
        value: paths.device.keyboard.key("l")
      },
      dest: {
        value: paths.app.logDebugFrame
      },
      xform: xforms.rising
    }
  ]
};

export const KBMBindings = {
  [sets.global]: [
    {
      src: { value: paths.device.keyboard.key("shift") },
      dest: { value: paths.app.boost },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.keyboard.key("q") },
      dest: { value: paths.app.snapRotateLeft },
      xform: xforms.rising,
      root: "q",
      priority: 100
    },
    {
      src: { value: paths.device.keyboard.key("e") },
      dest: { value: paths.app.snapRotateRight },
      xform: xforms.rising,
      root: "e",
      priority: 100
    },
    {
      src: { value: paths.device.hud.penButton },
      dest: { value: paths.app.spawnPen },
      xform: xforms.rising
    },
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
      xform: xforms.falling,
      priority: 100,
      root: "lmb"
    },
    {
      src: {
        value: paths.device.keyboard.key("l")
      },
      dest: {
        value: paths.app.logDebugFrame
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
      dest: { value: paths.app.cursorPenPrevColor },
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
      dest: { value: paths.app.cursorPenNextColor },
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
      dest: { value: paths.app.snapRotateLeft },
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
      dest: { value: paths.app.snapRotateRight },
      xform: xforms.rising,
      root: "e",
      priority: 200
    },
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.app.cursorStartDrawing },
      xform: xforms.rising,
      priority: 200
    },
    {
      src: { value: paths.device.mouse.buttonLeft },
      dest: { value: paths.app.cursorStopDrawing },
      xform: xforms.falling,
      priority: 200,
      root: "lmb"
    },
    {
      src: { value: paths.device.mouse.buttonRight },
      dest: { value: paths.app.cursorDrop },
      xform: xforms.falling,
      priority: 200
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
      dest: { value: paths.app.cursorScalePenTip },
      xform: xforms.scale(0.12)
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
        bool: paths.device.keyboard.key("shift"),
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
      xform: xforms.rising
    }
  ]
};

const touchpad = "/vars/oculusgo/touchpad";
const touchpadPressed = "/vars/oculusgo/touchpadPressed";
const dpadNorth = "/vars/oculusgo/dpad/north";
const dpadSouth = "/vars/oculusgo/dpad/south";
const dpadEast = "/vars/oculusgo/dpad/east";
const dpadWest = "/vars/oculusgo/dpad/west";
const dpadCenter = "/vars/oculusgo/dpad/center";
const vec2zero = "/vars/vec2zero";

const triggerRisingRoot = "oculusGoTriggerRising";
const triggerFallingRoot = "oculusGoTriggerFalling";

export const oculusGoBindings = {
  [sets.global]: [
    {
      src: {
        x: paths.device.oculusgo.axis("touchpadX"),
        y: paths.device.oculusgo.axis("touchpadY")
      },
      dest: { value: touchpad },
      xform: xforms.compose_vec2
    },
    {
      src: {
        value: paths.device.oculusgo.button("touchpad").pressed
      },
      dest: { value: touchpadPressed },
      xform: xforms.rising
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
      xform: xforms.vec2dpad(0.2)
    },
    {
      src: {
        value: dpadEast,
        bool: touchpadPressed
      },
      dest: {
        value: paths.app.snapRotateRight
      },
      xform: xforms.copyIfTrue
    },
    {
      src: {
        value: dpadWest,
        bool: touchpadPressed
      },
      dest: {
        value: paths.app.snapRotateLeft
      },
      xform: xforms.copyIfTrue
    },
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: {
        value: paths.app.startTeleport
      },
      xform: xforms.rising,
      root: triggerRisingRoot,
      priority: 100
    },
    {
      dest: { value: vec2zero },
      xform: xforms.always([0, -0.2])
    },
    {
      src: { value: vec2zero },
      dest: { value: paths.app.cursorPose },
      xform: xforms.poseFromCameraProjection()
    }
  ],

  [sets.cursorHoveringOnInteractable]: [
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: paths.app.cursorGrab },
      xform: xforms.rising,
      root: triggerRisingRoot,
      priority: 200
    },
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: paths.app.cursorDrop },
      xform: xforms.falling,
      root: triggerFallingRoot,
      priority: 200
    }
  ],

  [sets.rightHandTeleporting]: [
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: {
        value: paths.app.stopTeleport
      },
      xform: xforms.falling,
      root: triggerFallingRoot,
      priority: 100
    }
  ],

  [sets.cursorHoldingPen]: [
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: paths.app.cursorStartDrawing },
      xform: xforms.rising,
      root: triggerRisingRoot,
      priority: 300
    },
    {
      src: {
        value: paths.device.oculusgo.button("trigger").pressed
      },
      dest: { value: paths.app.cursorStopDrawing },
      xform: xforms.falling,
      root: triggerFallingRoot,
      priority: 300
    },
    {
      src: {
        value: dpadCenter,
        bool: touchpadPressed
      },
      dest: { value: paths.app.cursorDrop },
      xform: xforms.copyIfTrue
    }
  ]
};
