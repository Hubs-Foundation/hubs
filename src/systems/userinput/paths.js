export const paths = {};
paths.noop = "/noop";
paths.actions = {};
paths.actions.toggleScreenShare = "/actions/toggleScreenShare";
paths.actions.logDebugFrame = "/actions/logDebugFrame";
paths.actions.cameraDelta = "/actions/cameraDelta";
paths.actions.characterAcceleration = "/actions/characterAcceleration";
paths.actions.snapRotateLeft = "/actions/snapRotateLeft";
paths.actions.snapRotateRight = "/actions/snapRotateRight";
paths.actions.boost = "/actions/boost";
paths.actions.translate = {};
paths.actions.translate.forward = "/actions/translate/forward";
paths.actions.translate.backward = "/actions/translate/backward";
paths.actions.translate.up = "/actions/translate/up";
paths.actions.translate.down = "/actions/translate/down";
paths.actions.spawnPen = "/actions/spawnPen";
paths.actions.cursor = {};
paths.actions.cursor.pose = "/actions/cursorPose";
paths.actions.cursor.grab = "/actions/cursorGrab";
paths.actions.cursor.drop = "/actions/cursorDrop";
paths.actions.cursor.modDelta = "/actions/cursorModDelta";
paths.actions.cursor.startDrawing = "/actions/cursorStartDrawing";
paths.actions.cursor.stopDrawing = "/actions/cursorStopDrawing";
paths.actions.cursor.penNextColor = "/actions/cursorPenNextColor";
paths.actions.cursor.penPrevColor = "/actions/cursorPenPrevColor";
paths.actions.cursor.scalePenTip = "/actions/cursorScalePenTip";
paths.actions.cursor.scaleGrabbedGrabbable = "/actions/cursorScaleGrabbedGrabbable";
paths.actions.cursor.takeSnapshot = "/actions/cursorTakeSnapshot";
paths.actions.startTeleport = "/actions/startTeleport";
paths.actions.stopTeleport = "/actions/stopTeleport";
paths.actions.rightHand = {};
paths.actions.rightHand.pose = "/actions/rightHandPose";
paths.actions.rightHand.grab = "/actions/rightHandGrab";
paths.actions.rightHand.drop = "/actions/rightHandDrop";
paths.actions.rightHand.modDelta = "/actions/rightHandModDelta";
paths.actions.rightHand.startDrawing = "/actions/rightHandStartDrawing";
paths.actions.rightHand.stopDrawing = "/actions/rightHandStopDrawing";
paths.actions.rightHand.penNextColor = "/actions/rightHandPenNextColor";
paths.actions.rightHand.penPrevColor = "/actions/rightHandPenPrevColor";
paths.actions.rightHand.scalePenTip = "/actions/rightHandScalePenTip";
paths.actions.rightHand.startTeleport = "/actions/rightHandStartTeleport";
paths.actions.rightHand.stopTeleport = "/actions/rightHandStopTeleport";
paths.actions.rightHand.takeSnapshot = "/actions/rightHandTakeSnapshot";
paths.actions.leftHand = {};
paths.actions.leftHand.pose = "/actions/leftHandPose";
paths.actions.leftHand.grab = "/actions/leftHandGrab";
paths.actions.leftHand.drop = "/actions/leftHandDrop";
paths.actions.leftHand.modDelta = "/actions/leftHandModDelta";
paths.actions.leftHand.startDrawing = "/actions/leftHandStartDrawing";
paths.actions.leftHand.stopDrawing = "/actions/leftHandStopDrawing";
paths.actions.leftHand.penNextColor = "/actions/leftHandPenNextColor";
paths.actions.leftHand.penPrevColor = "/actions/leftHandPenPrevColor";
paths.actions.leftHand.scalePenTip = "/actions/leftHandScalePenTip";
paths.actions.leftHand.startTeleport = "/actions/leftHandStartTeleport";
paths.actions.leftHand.stopTeleport = "/actions/leftHandStopTeleport";
paths.actions.leftHand.takeSnapshot = "/actions/leftHandTakeSnapshot";

paths.device = {};
paths.device.mouse = {};
paths.device.mouse.coords = "/device/mouse/coords";
paths.device.mouse.movementXY = "/device/mouse/movementXY";
paths.device.mouse.buttonLeft = "/device/mouse/buttonLeft";
paths.device.mouse.buttonRight = "/device/mouse/buttonRight";
paths.device.mouse.wheel = "/device/mouse/wheel";
paths.device.smartMouse = {};
paths.device.smartMouse.cursorPose = "/device/smartMouse/cursorPose";
paths.device.smartMouse.cameraDelta = "/device/smartMouse/cameraDelta";
paths.device.touchscreen = {};
paths.device.touchscreen.cursorPose = "/device/touchscreen/cursorPose";
paths.device.touchscreen.cameraDelta = "/device/touchscreen/cameraDelta";
paths.device.touchscreen.pinchDelta = "/device/touchscreen/pinchDelta";
paths.device.touchscreen.initialPinchDistance = "/device/touchscreen/initialPinchDistance";
paths.device.touchscreen.currentPinchDistance = "/device/touchscreen/currentPinchDistance";
paths.device.touchscreen.isTouchingGrabbable = "/device/touchscreen/isTouchingGrabbable";
paths.device.hud = {};
paths.device.hud.penButton = "/device/hud/penButton";

paths.device.keyboard = {
  key: key => {
    return `/device/keyboard/${key.toLowerCase()}`;
  }
};

paths.device.gamepad = gamepadIndex => ({
  button: buttonIndex => ({
    pressed: `/device/gamepad/${gamepadIndex}/button/${buttonIndex}/pressed`,
    touched: `/device/gamepad/${gamepadIndex}/button/${buttonIndex}/touched`,
    value: `/device/gamepad/${gamepadIndex}/button/${buttonIndex}/value`
  }),
  axis: axisIndex => `/device/gamepad/${gamepadIndex}/axis/${axisIndex}`
});

const xbox = "/device/xbox/";
paths.device.xbox = {
  button: buttonName => ({
    pressed: `${xbox}button/${buttonName}/pressed`,
    touched: `${xbox}button/${buttonName}/touched`,
    value: `${xbox}button/${buttonName}/value`
  }),
  axis: axisName => {
    return `${xbox}axis/${axisName}`;
  }
};

const oculusgo = "/device/oculusgo/";
paths.device.oculusgo = {
  button: buttonName => ({
    pressed: `${oculusgo}button/${buttonName}/pressed`,
    touched: `${oculusgo}button/${buttonName}/touched`,
    value: `${oculusgo}button/${buttonName}/value`
  }),
  axis: axisName => {
    return `${oculusgo}axis/${axisName}`;
  },
  pose: `${oculusgo}pose`
};

const daydream = "/device/daydream/";
paths.device.daydream = {
  button: buttonName => ({
    pressed: `${daydream}button/${buttonName}/pressed`,
    touched: `${daydream}button/${buttonName}/touched`,
    value: `${daydream}button/${buttonName}/value`
  }),
  axis: axisName => {
    return `${daydream}axis/${axisName}`;
  },
  pose: `${daydream}pose`
};

const rightOculusTouch = "/device/rightOculusTouch/";
paths.device.rightOculusTouch = {
  button: buttonName => ({
    pressed: `${rightOculusTouch}button/${buttonName}/pressed`,
    touched: `${rightOculusTouch}button/${buttonName}/touched`,
    value: `${rightOculusTouch}button/${buttonName}/value`
  }),
  axis: axisName => {
    return `${rightOculusTouch}axis/${axisName}`;
  },
  pose: `${rightOculusTouch}pose`
};

const leftOculusTouch = "/device/leftOculusTouch/";
paths.device.leftOculusTouch = {
  button: buttonName => ({
    pressed: `${leftOculusTouch}button/${buttonName}/pressed`,
    touched: `${leftOculusTouch}button/${buttonName}/touched`,
    value: `${leftOculusTouch}button/${buttonName}/value`
  }),
  axis: axisName => {
    return `${leftOculusTouch}axis/${axisName}`;
  },
  pose: `${leftOculusTouch}pose`
};
