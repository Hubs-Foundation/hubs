import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

const leftButton = paths.device.webxr.left.button;
const leftAxis = paths.device.webxr.left.axis;
const leftPose = paths.device.webxr.left.pose;
const rightButton = paths.device.webxr.right.button;
const rightAxis = paths.device.webxr.right.axis;
const rightPose = paths.device.webxr.right.pose;

const v = path => "/webxr/var/" + path;
const wakeLeft = v("left/wake");
const wakeRight = v("right/wake");
const leftJoyXDeadzoned = v("left/joy/x/deadzoned");
const leftJoyYDeadzoned = v("left/joy/y/deadzoned");
const scaledLeftJoyX = v("left/scaledJoyX");
const scaledLeftJoyY = v("left/scaledJoyY");
const cursorDrop1 = v("right/cursorDrop1");
const cursorDrop2 = v("right/cursorDrop2");
const cursorDrop3 = v("right/cursorDrop3");
const leftCursorDrop2 = v("left/cursorDrop2");
const leftCursorDrop1 = v("left/cursorDrop1");
const rightHandDrop2 = v("right/rightHandDrop2");
const rightGripRisingGrab = v("right/grip/RisingGrab");
const leftGripRisingGrab = v("left/grip/RisingGrab");
const rightDpadNorth = v("rightDpad/north");
const rightDpadSouth = v("rightDpad/south");
const rightDpadEast = v("rightDpad/east");
const rightDpadWest = v("rightDpad/west");
const rightDpadCenter = v("rightDpad/center");
const rightJoy = v("right/joy");
const rightJoyY1 = v("right/joyY1");
const rightJoyYDeadzoned = v("right/joy/y/deadzoned");
const leftDpadNorth = v("leftDpad/north");
const leftDpadSouth = v("leftDpad/south");
const leftDpadEast = v("leftDpad/east");
const leftDpadWest = v("leftDpad/west");
const leftDpadCenter = v("leftDpad/center");
const leftJoy = v("left/joy");
const characterAcceleration = v("nonNormalizedCharacterAcceleration");
const rightBoost = v("right/boost");
const leftBoost = v("left/boost");
const lowerButtons = v("buttons/lower");
const upperButtons = v("buttons/upper");
const leftGripPressed1 = v("leftGripPressed1");
const leftGripPressed2 = v("leftGripPressed2");
const rightGripPressed1 = v("rightGripPressed1");
const rightGripPressed2 = v("rightGripPressed2");
const leftTriggerPressed1 = v("leftTriggerPressed1");
const leftTriggerPressed2 = v("leftTriggerPressed2");
const rightTriggerPressed1 = v("rightTriggerPressed1");
const rightTriggerPressed2 = v("rightTriggerPressed2");
const touchpad = v("touchpad");
const touchpadRising = v("touchpad/rising");
const dpadNorth = v("dpadNorth");
const dpadSouth = v("dpadSouth");
const dpadEast = v("dpadEast");
const dpadWest = v("dpadWest");
const dpadCenter = v("dpadCenter");
const dpadCenterStrip = v("dpadCenterStrip");
const snapRotateRight1 = v("snapRotateRight1");
const snapRotateRight2 = v("snapRotateRight2");
const snapRotateLeft1 = v("snapRotateLeft1");
const snapRotateLeft2 = v("snapRotateLeft2");
const centerStripPressed = v("centerStripPressed");
const touchpadReleased = v("touchpadReleased");
const lowerButtonsReleased = v("lowerButtonsReleased");

export const webXRUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: { value: paths.device.webxr.left.matrix },
      dest: { value: paths.actions.leftHand.matrix },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.webxr.right.matrix },
      dest: { value: paths.actions.rightHand.matrix },
      xform: xforms.copy
    },
    {
      src: { value: leftButton.grip.pressed },
      dest: { value: leftGripPressed1 },
      xform: xforms.copy
    },
    {
      src: { value: leftButton.grip.pressed },
      dest: { value: leftGripPressed2 },
      xform: xforms.copy
    },
    {
      src: { value: leftGripPressed1 },
      dest: { value: paths.actions.leftHand.middleRingPinky },
      xform: xforms.copy
    },
    {
      src: [leftButton.a.touched, leftButton.b.touched, leftButton.thumbStick.touched],
      dest: { value: paths.actions.leftHand.thumb },
      xform: xforms.any
    },
    {
      src: { value: leftButton.trigger.pressed },
      dest: { value: leftTriggerPressed1 },
      xform: xforms.copy
    },
    {
      src: { value: leftButton.trigger.pressed },
      dest: { value: leftTriggerPressed2 },
      xform: xforms.copy
    },
    {
      src: { value: leftTriggerPressed1 },
      dest: { value: paths.actions.leftHand.index },
      xform: xforms.copy
    },
    {
      src: { value: rightButton.grip.pressed },
      dest: { value: rightGripPressed1 },
      xform: xforms.copy
    },
    {
      src: { value: rightButton.grip.pressed },
      dest: { value: rightGripPressed2 },
      xform: xforms.copy
    },
    {
      src: { value: rightGripPressed1 },
      dest: { value: paths.actions.rightHand.middleRingPinky },
      xform: xforms.copy
    },
    {
      src: [rightButton.a.touched, rightButton.b.touched, rightButton.thumbStick.touched],
      dest: { value: paths.actions.rightHand.thumb },
      xform: xforms.any
    },
    {
      src: { value: rightButton.trigger.pressed },
      dest: { value: rightTriggerPressed1 },
      xform: xforms.copy
    },
    {
      src: { value: rightButton.trigger.pressed },
      dest: { value: rightTriggerPressed2 },
      xform: xforms.copy
    },
    {
      src: { value: rightTriggerPressed1 },
      dest: { value: paths.actions.rightHand.index },
      xform: xforms.copy
    },
    {
      src: {
        x: leftAxis.joyX,
        y: leftAxis.joyY
      },
      dest: { value: leftJoy },
      xform: xforms.compose_vec2
    },
    {
      src: { value: leftJoy },
      dest: {
        north: leftDpadNorth,
        south: leftDpadSouth,
        east: leftDpadEast,
        west: leftDpadWest,
        center: leftDpadCenter
      },
      xform: xforms.vec2dpad(0.2, false, true)
    },
    {
      src: { value: rightAxis.joyY },
      dest: { value: rightJoyY1 },
      xform: xforms.copy
    },
    {
      src: {
        x: rightAxis.joyX,
        y: rightJoyY1
      },
      dest: { value: rightJoy },
      xform: xforms.compose_vec2
    },
    {
      src: { value: rightJoy },
      dest: {
        north: rightDpadNorth,
        south: rightDpadSouth,
        east: rightDpadEast,
        west: rightDpadWest,
        center: rightDpadCenter
      },
      xform: xforms.vec2dpad(0.2, false, true)
    },
    {
      src: { value: rightDpadEast },
      dest: { value: paths.actions.snapRotateRight },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: [leftButton.a.pressed, rightButton.a.pressed],
      dest: { value: lowerButtons },
      xform: xforms.any
    },
    {
      src: [leftButton.b.pressed, rightButton.b.pressed],
      dest: { value: upperButtons },
      xform: xforms.any
    },
    {
      src: { value: rightDpadWest },
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: { value: leftAxis.joyY },
      dest: { value: leftJoyYDeadzoned },
      xform: xforms.deadzone(0.1)
    },
    {
      src: { value: leftJoyYDeadzoned },
      dest: { value: scaledLeftJoyY },
      xform: xforms.scale(-1.5) // horizontal character speed modifier
    },
    {
      src: { value: leftAxis.joyX },
      dest: { value: leftJoyXDeadzoned },
      xform: xforms.deadzone(0.1)
    },
    {
      src: { value: leftJoyXDeadzoned },
      dest: { value: scaledLeftJoyX },
      xform: xforms.scale(1.5) // horizontal character speed modifier
    },
    {
      src: {
        x: scaledLeftJoyX,
        y: scaledLeftJoyY
      },
      dest: { value: characterAcceleration },
      xform: xforms.compose_vec2
    },
    {
      src: { value: characterAcceleration },
      dest: { value: paths.actions.characterAcceleration },
      xform: xforms.copy
    },
    {
      src: { value: leftButton.b.pressed },
      dest: { value: leftBoost },
      xform: xforms.copy
    },
    {
      src: { value: rightButton.b.pressed },
      dest: { value: rightBoost },
      xform: xforms.copy
    },
    {
      src: { value: leftButton.thumbStick.pressed },
      dest: { value: paths.actions.nextCameraMode },
      xform: xforms.rising
    },
    {
      src: { value: rightButton.thumbStick.pressed },
      dest: { value: paths.actions.toggleFly },
      xform: xforms.rising
    },
    {
      src: [leftBoost, rightBoost],
      dest: { value: paths.actions.boost },
      xform: xforms.any
    },
    {
      src: { value: leftPose },
      dest: { value: paths.actions.cursor.left.pose },
      xform: xforms.copy
    },
    {
      src: { value: rightPose },
      dest: { value: paths.actions.cursor.right.pose },
      xform: xforms.copy
    },
    {
      src: { value: rightPose },
      dest: { value: paths.actions.rightHand.pose },
      xform: xforms.copy
    },
    {
      src: { value: leftPose },
      dest: { value: paths.actions.leftHand.pose },
      xform: xforms.copy
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.stopTeleport },
      xform: xforms.falling,
      priority: 1
    },
    {
      src: [leftButton.b.pressed, leftButton.a.pressed, leftButton.trigger.pressed, leftButton.grip.pressed],
      dest: { value: wakeLeft },
      xform: xforms.any
    },
    {
      src: { value: wakeLeft },
      dest: { value: paths.actions.cursor.left.wake },
      xform: xforms.rising
    },
    {
      src: [rightButton.b.pressed, rightButton.a.pressed, rightButton.trigger.pressed, rightButton.grip.pressed],
      dest: { value: wakeRight },
      xform: xforms.any
    },
    {
      src: { value: wakeRight },
      dest: { value: paths.actions.cursor.right.wake },
      xform: xforms.rising
    },
    {
      src: {
        x: rightAxis.touchpadX,
        y: rightAxis.touchpadY
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
      xform: xforms.vec2dpad(0.3)
    },
    {
      src: [dpadNorth, dpadCenter, dpadSouth],
      dest: { value: dpadCenterStrip },
      xform: xforms.any
    },
    {
      src: {
        value: dpadCenterStrip,
        bool: rightButton.touchpad.pressed
      },
      dest: { value: centerStripPressed },
      xform: xforms.copyIfTrue
    },
    {
      src: [centerStripPressed, lowerButtons],
      dest: { value: paths.actions.ensureFrozen },
      xform: xforms.any
    },
    {
      src: { value: rightButton.touchpad.pressed },
      dest: { value: touchpadReleased },
      xform: xforms.falling
    },
    {
      src: { value: lowerButtons },
      dest: { value: lowerButtonsReleased },
      xform: xforms.falling
    },
    {
      src: [touchpadReleased, lowerButtonsReleased],
      dest: { value: paths.actions.thaw },
      xform: xforms.any
    },
    {
      src: { value: rightButton.touchpad.pressed },
      dest: { value: touchpadRising },
      xform: xforms.rising
    },
    {
      src: {
        value: dpadEast,
        bool: touchpadRising
      },
      dest: { value: snapRotateRight1 },
      xform: xforms.copyIfTrue
    },
    {
      src: {
        value: dpadWest,
        bool: touchpadRising
      },
      dest: { value: snapRotateLeft1 },
      xform: xforms.copyIfTrue
    },
    {
      src: { value: rightDpadEast },
      dest: { value: snapRotateRight2 },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: { value: rightDpadWest },
      dest: { value: snapRotateLeft2 },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: [snapRotateRight1, snapRotateRight2],
      dest: { value: paths.actions.snapRotateRight },
      xform: xforms.any
    },
    {
      src: [snapRotateLeft1, snapRotateLeft2],
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.any
    }
  ],

  [sets.leftHandHoveringOnNothing]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.startTeleport },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.rightCursorHoveringOnUI]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.right.grab },
      xform: xforms.rising,
      priority: 2
    }
  ],

  [sets.leftCursorHoveringOnUI]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.cursor.left.grab },
      xform: xforms.rising,
      priority: 2
    }
  ],

  [sets.rightCursorHoveringOnVideo]: [
    {
      src: { value: rightAxis.joyY },
      dest: { value: paths.actions.cursor.right.mediaVolumeMod },
      xform: xforms.scale(-0.01)
    }
  ],

  [sets.leftCursorHoveringOnVideo]: [
    {
      src: { value: leftAxis.joyY },
      dest: { value: paths.actions.cursor.left.mediaVolumeMod },
      xform: xforms.scale(-0.01)
    }
  ],

  [sets.rightCursorHoveringOnNothing]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.leftCursorHoveringOnNothing]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.startTeleport },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.leftHandHoveringOnInteractable]: [
    {
      src: { value: leftGripPressed2 },
      dest: { value: leftGripRisingGrab },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: [leftGripRisingGrab],
      dest: { value: paths.actions.leftHand.grab },
      xform: xforms.any,
      priority: 2
    },
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.stopTeleport },
      xform: xforms.falling,
      priority: 2
    }
  ],

  [sets.inspecting]: [
    {
      src: { value: upperButtons },
      dest: { value: paths.actions.stopInspecting },
      xform: xforms.falling
    }
  ],

  [sets.leftHandHoldingInteractable]: [
    {
      src: { value: leftGripPressed2 },
      dest: { value: paths.actions.leftHand.drop },
      xform: xforms.falling
    }
  ],

  [sets.leftHandHoveringOnPen]: [],
  [sets.leftHandHoldingPen]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.startDrawing },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.stopDrawing },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: { value: leftDpadEast },
      dest: { value: paths.actions.leftHand.penNextColor },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: { value: leftDpadWest },
      dest: { value: paths.actions.leftHand.penPrevColor },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: { value: leftJoyYDeadzoned },
      dest: { value: paths.actions.leftHand.scalePenTip },
      xform: xforms.scaleExp(-0.005, 5),
      priority: 1
    },
    {
      src: { value: leftButton.b.pressed },
      dest: { value: paths.actions.leftHand.switchDrawMode },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: { value: leftButton.a.pressed },
      dest: { value: paths.actions.leftHand.undoDrawing },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.rightCursorHoveringOnInteractable]: [
    {
      src: { value: rightGripPressed2 },
      dest: { value: rightGripRisingGrab },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: [rightGripRisingGrab, rightTriggerPressed2],
      dest: { value: paths.actions.cursor.right.grab },
      xform: xforms.any,
      priority: 2
    },
    {
      src: { value: upperButtons },
      dest: { value: paths.actions.startInspecting },
      xform: xforms.rising
    }
  ],

  [sets.leftCursorHoveringOnInteractable]: [
    {
      src: { value: leftGripPressed2 },
      dest: { value: leftGripRisingGrab },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: [leftGripRisingGrab],
      dest: { value: paths.actions.cursor.left.grab },
      xform: xforms.any,
      priority: 2
    },
    {
      src: { value: upperButtons },
      dest: { value: paths.actions.startInspecting },
      xform: xforms.rising
    }
  ],

  [sets.rightCursorHoldingUI]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: cursorDrop2 },
      xform: xforms.falling,
      priority: 5
    }
  ],
  [sets.leftCursorHoldingUI]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: leftCursorDrop2 },
      xform: xforms.falling,
      priority: 5
    }
  ],

  [sets.rightCursorHoldingInteractable]: [
    {
      src: { value: rightAxis.joyY },
      dest: { value: paths.actions.cursor.right.modDelta },
      xform: xforms.scale(0.1)
    },
    {
      src: { value: rightGripPressed2 },
      dest: { value: cursorDrop1 },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: cursorDrop3 },
      xform: xforms.falling,
      priority: 4
    },
    {
      src: [cursorDrop1, cursorDrop2, cursorDrop3],
      dest: { value: paths.actions.cursor.right.drop },
      xform: xforms.any,
      priority: 2
    }
  ],

  [sets.leftCursorHoldingInteractable]: [
    {
      src: { value: leftAxis.joyY },
      dest: { value: paths.actions.cursor.left.modDelta },
      xform: xforms.scale(0.1)
    },
    {
      src: { value: leftGripPressed2 },
      dest: { value: leftCursorDrop1 },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: [leftCursorDrop1, leftCursorDrop2],
      dest: { value: paths.actions.cursor.left.drop },
      xform: xforms.any,
      priority: 2
    }
  ],

  [sets.rightCursorHoveringOnPen]: [],

  [sets.rightCursorHoldingPen]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.right.startDrawing },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.cursor.right.stopDrawing },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: { value: rightButton.b.pressed },
      dest: { value: paths.actions.cursor.right.undoDrawing },
      xform: xforms.rising,
      priority: 1
    }
  ],
  [sets.leftCursorHoldingPen]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.cursor.left.startDrawing },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.cursor.left.stopDrawing },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: { value: leftButton.b.pressed },
      dest: { value: paths.actions.cursor.left.undoDrawing },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.rightHandHoveringOnInteractable]: [
    {
      src: { value: rightGripPressed2 },
      dest: { value: rightGripRisingGrab },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: [rightGripRisingGrab],
      dest: { value: paths.actions.rightHand.grab },
      xform: xforms.any,
      priority: 2
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.falling,
      priority: 2
    }
  ],

  [sets.rightHandHoldingInteractable]: [
    {
      src: { value: rightGripPressed2 },
      dest: { value: rightHandDrop2 },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: [rightHandDrop2],
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.any,
      priority: 2
    }
  ],
  [sets.rightHandHoveringOnPen]: [],
  [sets.rightHandHoldingPen]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.startDrawing },
      xform: xforms.rising,
      priority: 3
    },
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.stopDrawing },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: { value: rightDpadEast },
      dest: { value: paths.actions.rightHand.penNextColor },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: { value: rightDpadWest },
      dest: { value: paths.actions.rightHand.penPrevColor },
      xform: xforms.rising,
      priority: 2
    },
    {
      src: { value: rightAxis.joyY },
      dest: { value: rightJoyYDeadzoned },
      xform: xforms.deadzone(0.1)
    },
    {
      src: { value: rightJoyYDeadzoned },
      dest: { value: paths.actions.rightHand.scalePenTip },
      xform: xforms.scaleExp(-0.005, 5),
      priority: 2
    },
    {
      src: { value: rightGripPressed2 },
      dest: { value: paths.actions.rightHand.drop },
      xform: xforms.falling,
      priority: 3
    },
    {
      src: { value: rightButton.b.pressed },
      dest: { value: paths.actions.rightHand.switchDrawMode },
      xform: xforms.rising,
      priority: 1
    },
    {
      src: { value: rightButton.a.pressed },
      dest: { value: paths.actions.rightHand.undoDrawing },
      xform: xforms.rising,
      priority: 1
    }
  ],

  [sets.rightCursorHoveringOnCamera]: [],
  [sets.rightHandHoveringOnCamera]: [],
  [sets.leftHandHoveringOnCamera]: [],

  [sets.rightHandHoldingCamera]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: paths.actions.rightHand.takeSnapshot },
      xform: xforms.copy,
      priority: 4
    }
  ],
  [sets.leftHandHoldingCamera]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.leftHand.takeSnapshot },
      xform: xforms.copy,
      priority: 4
    }
  ],
  [sets.rightCursorHoldingCamera]: [
    {
      src: { value: rightTriggerPressed2 },
      dest: { value: cursorDrop3 },
      xform: xforms.falling,
      priority: 4
    }
  ],
  [sets.leftCursorHoldingCamera]: [
    {
      src: { value: leftTriggerPressed2 },
      dest: { value: paths.actions.cursor.left.takeSnapshot },
      xform: xforms.copy,
      priority: 4
    }
  ],

  [sets.rightHandHoveringOnNothing]: [],
  [sets.inputFocused]: []
});
