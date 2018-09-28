export const paths = {};
paths.noop = "/noop";
paths.actions = {};
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
paths.actions.cursorPose = "/actions/cursorPose";
paths.actions.cursorGrab = "/actions/cursorGrab";
paths.actions.cursorDrop = "/actions/cursorDrop";
paths.actions.cursorModDelta = "/actions/cursorModDelta";
paths.actions.cursorStartDrawing = "/actions/cursorStartDrawing";
paths.actions.cursorStopDrawing = "/actions/cursorStopDrawing";
paths.actions.cursorPenNextColor = "/actions/cursorPenNextColor";
paths.actions.cursorPenPrevColor = "/actions/cursorPenPrevColor";
paths.actions.cursorScalePenTip = "/actions/cursorScalePenTip";
paths.actions.startTeleport = "/actions/startTeleport";
paths.actions.stopTeleport = "/actions/stopTeleport";
paths.actions.rightHandPose = "/actions/rightHandPose";
paths.actions.rightHandGrab = "/actions/rightHandGrab";
paths.actions.rightHandDrop = "/actions/rightHandDrop";
paths.actions.rightHandModDelta = "/actions/rightHandModDelta";
paths.actions.rightHandStartDrawing = "/actions/rightHandStartDrawing";
paths.actions.rightHandStopDrawing = "/actions/rightHandStopDrawing";
paths.actions.rightHandPenNextColor = "/actions/rightHandPenNextColor";
paths.actions.rightHandPenPrevColor = "/actions/rightHandPenPrevColor";
paths.actions.rightHandScalePenTip = "/actions/rightHandScalePenTip";
paths.actions.rightHandStartTeleport = "/actions/rightHandStartTeleport";
paths.actions.rightHandStopTeleport = "/actions/rightHandStopTeleport";
paths.actions.leftHandPose = "/actions/leftHandPose";
paths.actions.leftHandGrab = "/actions/leftHandGrab";
paths.actions.leftHandDrop = "/actions/leftHandDrop";
paths.actions.leftHandModDelta = "/actions/leftHandModDelta";
paths.actions.leftHandStartDrawing = "/actions/leftHandStartDrawing";
paths.actions.leftHandStopDrawing = "/actions/leftHandStopDrawing";
paths.actions.leftHandPenNextColor = "/actions/leftHandPenNextColor";
paths.actions.leftHandPenPrevColor = "/actions/leftHandPenPrevColor";
paths.actions.leftHandScalePenTip = "/actions/leftHandScalePenTip";
paths.actions.leftHandStartTeleport = "/actions/leftHandStartTeleport";
paths.actions.leftHandStopTeleport = "/actions/leftHandStopTeleport";

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
  }
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
