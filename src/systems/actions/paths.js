export const paths = {};
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
paths.device.touchscreen.joystickLeft = "/device/touchscreen/joystickLeft";
paths.device.touchscreen.joystickRight = "/device/touchscreen/joystickRight";
paths.device.touchscreen.targetlessPinch = "/device/touchscreen/targetlessPinch";
paths.device.touchscreen.interactablePinch = "/device/touchscreen/interactablePinch";

paths.device.keyboard = "/device/keyboard/";
// There are so many keys on the keyboard that the paths here
// are written like `${paths.device.keyboard}${key}` where `key`
// comes from the dom's keyboard events
paths.device.gamepad = {};
