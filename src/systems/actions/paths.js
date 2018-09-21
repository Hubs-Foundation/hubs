export const paths = {};
paths.noop = "/noop";
paths.app = {};
paths.app.logDebugFrame = "/app/logDebugFrame";
paths.app.cameraDelta = "/app/cameraDelta";
paths.app.cursorPose = "/app/cursorPose";
paths.app.cursorModDelta = "/app/cursorModDelta";
paths.app.cursorGrab = "/app/cursorGrab";
paths.app.cursorDrop = "/app/cursorDrop";
paths.app.cursorStartDrawing = "/app/cursorStartDrawing";
paths.app.cursorStopDrawing = "/app/cursorStopDrawing";
paths.app.cursorScalePenTip = "/app/cursorScalePenTip";
paths.app.cursorPenNextColor = "/app/cursorPenNextColor";
paths.app.cursorPenPrevColor = "/app/cursorPenPrevColor";
paths.app.spawnPen = "/app/spawnPen";

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
paths.device.touchscreen.isTouchingGrabbable = "/device/touchscreen/isTouchingGrabbable";

paths.device.hud = {};
paths.device.hud.penButton = "/device/hud/penButton";

paths.device.keyboard = "/device/keyboard/";
// There are so many keys on the keyboard that the paths here
// are written like `${paths.device.keyboard}${key}` where `key`
// comes from the dom's keyboard events

paths.device.gamepad = gamepadIndex => ({
  button: buttonIndex => ({
    pressed: `/device/gamepad/${gamepadIndex}/button/${buttonIndex}`,
    touched: `/device/gamepad/${gamepadIndex}/button/${buttonIndex}`,
    value: `/device/gamepad/${gamepadIndex}/button/${buttonIndex}`
  }),
  axis: axisIndex => `/device/gamepad/${gamepadIndex}/button/${axisIndex}`
});
