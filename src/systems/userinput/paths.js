export const paths = {};
paths.noop = "/noop";
paths.actions = {};
paths.actions.log = "/actions/log";
paths.actions.toggleScreenShare = "/actions/toggleScreenShare";
paths.actions.snapRotateLeft = "/actions/snapRotateLeft";
paths.actions.snapRotateRight = "/actions/snapRotateRight";
paths.actions.angularVelocity = "/actions/angularVelocity";
paths.actions.logDebugFrame = "/actions/logDebugFrame";
paths.actions.logInteractionState = "/actions/logInteractionState";
paths.actions.cameraDelta = "/actions/cameraDelta";
paths.actions.lobbyCameraDelta = "/actions/lobbyCameraDelta";
paths.actions.characterAcceleration = "/actions/characterAcceleration";
paths.actions.boost = "/actions/boost";
paths.actions.startGazeTeleport = "/actions/startTeleport";
paths.actions.stopGazeTeleport = "/actions/stopTeleport";
paths.actions.spawnPen = "/actions/spawnPen";
paths.actions.ensureFrozen = "/actions/ensureFrozen";
paths.actions.toggleFreeze = "/actions/toggleFreeze";
paths.actions.thaw = "/actions/thaw";
paths.actions.muteMic = "/actions/muteMic";
paths.actions.focusChat = "/actions/focusChat";
paths.actions.focusChatCommand = "/actions/focusChatCommand";
paths.actions.toggleCamera = "/actions/toggleCamera";
paths.actions.takeSnapshot = "/actions/takeSnapshot";
paths.actions.mediaExit = "/actions/mediaExit";
paths.actions.mediaSearch1 = "/actions/mediaSearch1";
paths.actions.mediaSearch2 = "/actions/mediaSearch2";
paths.actions.mediaSearch3 = "/actions/mediaSearch3";
paths.actions.mediaSearch4 = "/actions/mediaSearch4";
paths.actions.mediaSearch5 = "/actions/mediaSearch5";
paths.actions.mediaSearch6 = "/actions/mediaSearch6";
paths.actions.mediaSearch7 = "/actions/mediaSearch7";
paths.actions.mediaSearch8 = "/actions/mediaSearch8";
paths.actions.transformModifier = "/actions/transformModifier";
paths.actions.rayObjectRotation = "/actions/rayObjectRotation";
paths.actions.cursor = {};
paths.actions.cursor.pose = "/actions/cursorPose";
paths.actions.cursor.hideLine = "/actions/cursorHideLine";
paths.actions.cursor.grab = "/actions/cursorGrab";
paths.actions.cursor.drop = "/actions/cursorDrop";
paths.actions.cursor.modDelta = "/actions/cursorModDelta";
paths.actions.cursor.startDrawing = "/actions/cursorStartDrawing";
paths.actions.cursor.stopDrawing = "/actions/cursorStopDrawing";
paths.actions.cursor.undoDrawing = "/actions/cursorUndoDrawing";
paths.actions.cursor.penNextColor = "/actions/cursorPenNextColor";
paths.actions.cursor.penPrevColor = "/actions/cursorPenPrevColor";
paths.actions.cursor.scalePenTip = "/actions/cursorScalePenTip";
paths.actions.cursor.scaleGrabbedGrabbable = "/actions/cursorScaleGrabbedGrabbable";
paths.actions.cursor.mediaVolumeMod = "/actions/cursor/mediaVolumeMod";
paths.actions.cursor.takeSnapshot = "/actions/cursorTakeSnapshot";
paths.actions.pen = {};
paths.actions.pen.remove = "/actions/pen/remove";
paths.actions.rightHand = {};
paths.actions.rightHand.matrix = "/actions/rightHand/matrix";
paths.actions.rightHand.pose = "/actions/rightHandPose";
paths.actions.rightHand.grab = "/actions/rightHandGrab";
paths.actions.rightHand.drop = "/actions/rightHandDrop";
paths.actions.rightHand.modDelta = "/actions/rightHandModDelta";
paths.actions.rightHand.startDrawing = "/actions/rightHandStartDrawing";
paths.actions.rightHand.stopDrawing = "/actions/rightHandStopDrawing";
paths.actions.rightHand.undoDrawing = "/actions/rightHandUndoDrawing";
paths.actions.rightHand.switchDrawMode = "/actions/rightHandSwitchDrawMode";
paths.actions.rightHand.penNextColor = "/actions/rightHandPenNextColor";
paths.actions.rightHand.penPrevColor = "/actions/rightHandPenPrevColor";
paths.actions.rightHand.scalePenTip = "/actions/rightHandScalePenTip";
paths.actions.rightHand.startTeleport = "/actions/rightHand/startTeleport";
paths.actions.rightHand.stopTeleport = "/actions/rightHand/stopTeleport";
paths.actions.rightHand.takeSnapshot = "/actions/rightHandTakeSnapshot";
paths.actions.rightHand.thumb = "/actions/rightHand/thumbDown";
paths.actions.rightHand.index = "/actions/rightHand/indexDown";
paths.actions.rightHand.middleRingPinky = "/actions/rightHand/middleRingPinkyDown";
paths.actions.leftHand = {};
paths.actions.leftHand.matrix = "/actions/leftHand/matrix";
paths.actions.leftHand.pose = "/actions/leftHandPose";
paths.actions.leftHand.grab = "/actions/leftHandGrab";
paths.actions.leftHand.drop = "/actions/leftHandDrop";
paths.actions.leftHand.modDelta = "/actions/leftHandModDelta";
paths.actions.leftHand.startDrawing = "/actions/leftHandStartDrawing";
paths.actions.leftHand.stopDrawing = "/actions/leftHandStopDrawing";
paths.actions.leftHand.undoDrawing = "/actions/leftHandUndoDrawing";
paths.actions.leftHand.switchDrawMode = "/actions/leftHandSwitchDrawMode";
paths.actions.leftHand.penNextColor = "/actions/leftHandPenNextColor";
paths.actions.leftHand.penPrevColor = "/actions/leftHandPenPrevColor";
paths.actions.leftHand.scalePenTip = "/actions/leftHandScalePenTip";
paths.actions.leftHand.startTeleport = "/actions/leftHand/startTeleport";
paths.actions.leftHand.stopTeleport = "/actions/leftHand/stopTeleport";
paths.actions.leftHand.takeSnapshot = "/actions/leftHandTakeSnapshot";
paths.actions.leftHand.thumb = "/actions/leftHand/thumbDown";
paths.actions.leftHand.index = "/actions/leftHand/indexDown";
paths.actions.leftHand.middleRingPinky = "/actions/leftHand/middleRingPinkyDown";
paths.actions.camera = {};
paths.actions.camera.exitMirror = "/actions/cameraExitMirror";
paths.haptics = {};
paths.haptics.actuators = {};
paths.haptics.actuators.left = "/haptics/actuators/left";
paths.haptics.actuators.right = "/haptics/actuators/right";

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
paths.device.touchscreen.touchCameraDelta = "/device/touchscreen/touchCameraDelta";
paths.device.touchscreen.gyroCameraDelta = "/device/touchscreen/gyroCameraDelta";
paths.device.touchscreen.cameraDelta = "/device/touchscreen/cameraDelta";
paths.device.touchscreen.pinch = {};
paths.device.touchscreen.pinch.delta = "/device/touchscreen/pinch/delta";
paths.device.touchscreen.pinch.initialDistance = "/device/touchscreen/pinch/initialDistance";
paths.device.touchscreen.pinch.currentDistance = "/device/touchscreen/pinch/currentDistance";
paths.device.touchscreen.isTouching = "/device/touchscreen/isTouching";
paths.device.touchscreen.isTouchingGrabbable = "/device/touchscreen/isTouchingGrabbable";
paths.device.touchscreen.tap1 = "/device/touchscreen/tap1";
paths.device.touchscreen.tap2 = "/device/touchscreen/tap2";
paths.device.touchscreen.tap3 = "/device/touchscreen/tap3";
paths.device.touchscreen.tap4 = "/device/touchscreen/tap4";
paths.device.touchscreen.tap5 = "/device/touchscreen/tap5";
paths.device.gyro = {};
paths.device.gyro.averageDeltaX = "/device/gyro/averageDeltaX";
paths.device.gyro.averageDeltaY = "/device/gyro/averageDeltaY";
paths.device.hud = {};
paths.device.hud.penButton = "/device/hud/penButton";

paths.device.keyboard = {
  map: new Map(),
  key: function(k) {
    let path = this.map.get(k);
    if (path) {
      return path;
    }
    path = `/device/keyboard/${k.toLowerCase()}`;
    this.map.set(k, path);
    return path;
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
  v: name => `/vars/xbox/${name}`,
  button: buttonName => ({
    pressed: `${xbox}button/${buttonName}/pressed`,
    touched: `${xbox}button/${buttonName}/touched`,
    value: `${xbox}button/${buttonName}/value`
  }),
  axis: axisName => {
    return `${xbox}axis/${axisName}`;
  },
  axesSum: `${xbox}axis/sum`
};

paths.device.oculusgo = {
  // TODO remove these in favor of the direct accessors
  button: buttonName => ({
    pressed: `/device/oculusgo/button/${buttonName}/pressed`,
    touched: `/device/oculusgo/button/${buttonName}/touched`,
    value: `/device/oculusgo/button/${buttonName}/value`
  }),
  axis: axisName => {
    return `/device/oculusgo/axis/${axisName}`;
  },
  //
  trigger: {
    pressed: "/device/oculusgo/button/trigger/pressed",
    touched: "/device/oculusgo/button/trigger/touched",
    value: "/device/oculusgo/button/trigger/value"
  },
  touchpad: {
    pressed: "/device/oculusgo/button/touchpad/pressed",
    touched: "/device/oculusgo/button/touchpad/touched",
    value: "/device/oculusgo/button/touchpad/value",
    axisX: "/device/oculusgo/axis/touchpadX",
    axisY: "/device/oculusgo/axis/touchpadY"
  },
  pose: "/device/oculusgo/pose",
  matrix: "/device/oculusgo/matrix",
  v: name => {
    return `/vars/oculusgo/${name}`;
  }
};

const gearVRController = "/device/gearVRController/";
paths.device.gearVRController = {
  button: buttonName => ({
    pressed: `${gearVRController}button/${buttonName}/pressed`,
    touched: `${gearVRController}button/${buttonName}/touched`,
    value: `${gearVRController}button/${buttonName}/value`
  }),
  axis: axisName => {
    return `${gearVRController}axis/${axisName}`;
  },
  pose: `${gearVRController}pose`,
  matrix: `${gearVRController}matrix`,
  v: name => {
    return `/vars/gearVRController/${name}`;
  }
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
  pose: `${daydream}pose`,
  matrix: `${daydream}matrix`
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
  axesSum: `${rightOculusTouch}axis/sum`,
  pose: `${rightOculusTouch}pose`,
  matrix: `${rightOculusTouch}matrix`
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
  axesSum: `${leftOculusTouch}axis/sum`,
  pose: `${leftOculusTouch}pose`,
  matrix: `${leftOculusTouch}matrix`
};

paths.device.vive = {};
paths.device.vive.left = {
  button: buttonName => ({
    pressed: `/device/vive/left/button/${buttonName}/pressed`,
    touched: `/device/vive/left/button/${buttonName}/touched`,
    value: `/device/vive/left/button/${buttonName}/value`
  }),
  axis: axisName => {
    return `/device/vive/left/axis/${axisName}`;
  },
  axesSum: "/device/vive/left/axis/sum",
  pose: `/device/vive/left/pose`,
  matrix: `/device/vive/left/matrix`
};
paths.device.vive.right = {
  button: buttonName => ({
    pressed: `/device/vive/right/button/${buttonName}/pressed`,
    touched: `/device/vive/right/button/${buttonName}/touched`,
    value: `/device/vive/right/button/${buttonName}/value`
  }),
  axis: axisName => {
    return `/device/vive/right/axis/${axisName}`;
  },
  axesSum: "/device/vive/right/axis/sum",
  pose: `/device/vive/right/pose`,
  matrix: `/device/vive/right/matrix`
};

function button(device, side, name) {
  return {
    pressed: `${device}${side}/button/${name}/pressed`,
    touched: `${device}${side}/button/${name}/touched`,
    value: `${device}${side}/button/${name}/value`
  };
}

function axes(device, side, name) {
  return {
    axisX: `${device}${side}/axis/${name}X`,
    axisY: `${device}${side}/axis/${name}Y`
  };
}

function wmrController(side) {
  const wmr = "/device/wmr/";
  return {
    touchpad: {
      ...button(wmr, side, "touchpad"),
      ...axes(wmr, side, "touchpad")
    },
    trigger: button(wmr, side, "trigger"),
    grip: button(wmr, side, "grip"),
    menu: button(wmr, side, "menu"),
    joystick: axes(wmr, side, "joystick"),
    pose: `${wmr}${side}/pose`,
    matrix: `${wmr}${side}/matrix`
  };
}
paths.device.wmr = {};
paths.device.wmr.v = name => `/vars/wmr/${name}`;
paths.device.wmr.k = name => `/vars/wmr/keyboard/${name}`;
paths.device.wmr.left = wmrController("left");
paths.device.wmr.right = wmrController("right");
