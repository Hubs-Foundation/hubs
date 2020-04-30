import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

function controllerTransformBindings() {
  return [
    {
      src: { value: paths.device.webXR.left.matrix },
      dest: { value: paths.actions.leftHand.matrix },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.webXR.right.matrix },
      dest: { value: paths.actions.rightHand.matrix },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.webXR.left.pose },
      dest: { value: paths.actions.leftHand.pose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.webXR.right.pose },
      dest: { value: paths.actions.rightHand.pose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.webXR.left.pose },
      dest: { value: paths.actions.cursor.left.pose },
      xform: xforms.copy
    },
    {
      src: { value: paths.device.webXR.right.pose },
      dest: { value: paths.actions.cursor.right.pose },
      xform: xforms.copy
    }
  ];
}

function characterAccelerationBindings() {
  const lJoyXDeadzoned = paths.device.webXR.v("left/joy/x/deadzoned");
  const lJoyYDeadzoned = paths.device.webXR.v("left/joy/y/deadzoned");
  const lJoyXScaled = paths.device.webXR.v("left/joy/x/scaled");
  const lJoyYScaled = paths.device.webXR.v("left/joy/y/scaled");
  return [
    {
      src: { value: paths.device.webXR.left.joystick.axisX },
      dest: { value: lJoyXDeadzoned },
      xform: xforms.deadzone(0.1)
    },
    {
      src: { value: lJoyXDeadzoned },
      dest: { value: lJoyXScaled },
      xform: xforms.scale(1.5) // horizontal character speed modifier
    },
    {
      src: { value: paths.device.webXR.left.joystick.axisY },
      dest: { value: lJoyYDeadzoned },
      xform: xforms.deadzone(0.1)
    },
    {
      src: { value: lJoyYDeadzoned },
      dest: { value: lJoyYScaled },
      xform: xforms.scale(-1.5) // vertical character speed modifier
    },
    {
      src: { x: lJoyXScaled, y: lJoyYScaled },
      dest: { value: paths.actions.characterAcceleration },
      xform: xforms.compose_vec2
    }
  ];
}

function teleportationAndRotationBindings() {
  const rightJoy = paths.device.webXR.v("right/joy");
  const rightJoyWest = paths.device.webXR.v("right/joy/west");
  const rightJoyEast = paths.device.webXR.v("right/joy/east");
  return [
    {
      src: {
        x: paths.device.webXR.right.joystick.axisX,
        y: paths.device.webXR.right.joystick.axisY
      },
      dest: { value: rightJoy },
      xform: xforms.compose_vec2
    },
    {
      src: { value: rightJoy },
      dest: { west: rightJoyWest, east: rightJoyEast },
      xform: xforms.vec2dpad(0.2)
    },
    {
      src: { value: rightJoyWest },
      dest: { value: paths.actions.snapRotateLeft },
      xform: xforms.rising
    },
    {
      src: { value: rightJoyEast },
      dest: { value: paths.actions.snapRotateRight },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.webXR.right.trigger.pressed },
      dest: { value: paths.actions.rightHand.startTeleport },
      xform: xforms.rising
    }
  ];
}

function handPoseBindings(hand) {
  const triggerPressed = paths.device.webXR[hand].trigger.pressed;
  const gripPressed = paths.device.webXR[hand].grip.pressed;
  const actions = paths.actions[hand + "Hand"];
  return [
    {
      src: { value: triggerPressed },
      dest: { value: actions.index },
      xform: xforms.copy
    },
    {
      src: { value: gripPressed },
      dest: { value: actions.middleRingPinky },
      xform: xforms.copy
    }
  ];
}

function cursorGrabBindings(hand) {
  return [
    {
      src: { value: paths.device.webXR[hand].trigger.pressed },
      dest: { value: paths.actions.cursor[hand].grab },
      xform: xforms.rising
    }
  ];
}

function cursorDropBindings(hand) {
  return [
    {
      src: { value: paths.device.webXR[hand].trigger.pressed },
      dest: { value: paths.actions.cursor[hand].drop },
      xform: xforms.falling
    }
  ];
}

export const webXRUserBindings = addSetsToBindings({
  [sets.global]: [
    ...controllerTransformBindings(),
    ...characterAccelerationBindings(),
    ...teleportationAndRotationBindings(),
    ...handPoseBindings("left"),
    ...handPoseBindings("right")
  ],

  [sets.rightHandTeleporting]: [
    {
      src: { value: paths.device.webXR.right.trigger.pressed },
      dest: { value: paths.actions.rightHand.stopTeleport },
      xform: xforms.falling
    }
  ],

  [sets.leftCursorHoveringOnUI]: [...cursorGrabBindings("left")],
  [sets.rightCursorHoveringOnUI]: [...cursorGrabBindings("right")],
  [sets.leftCursorHoldingUI]: [...cursorDropBindings("left")],
  [sets.rightCursorHoldingUI]: [...cursorDropBindings("right")],

  [sets.leftCursorHoveringOnInteractable]: [...cursorGrabBindings("left")],
  [sets.rightCursorHoveringOnInteractable]: [...cursorGrabBindings("right")],
  [sets.leftCursorHoldingInteractable]: [...cursorDropBindings("left")],
  [sets.rightCursorHoldingInteractable]: [...cursorDropBindings("right")],

  //[sets.leftHandHoveringOnInteractable]: [...handGrabBindings("left")],
  //[sets.rightHandHoveringOnInteractable]: [...handGrabBindings("right")],
  //[sets.leftHandHoldingInteractable]: [...handDropBindings("left")],
  //[sets.rightHandHoldingInteractable]: [...handDropBindings("right")]
});
